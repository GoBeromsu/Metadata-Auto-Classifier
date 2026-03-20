import { ClassificationService, ClassificationContext } from '../../src/classifier/ClassificationService';
import type { App, TFile, MetadataCache, Vault } from 'obsidian';
import type { FrontmatterField, ProviderConfig, OAuthTokens } from '../../src/types';
import { processAPIRequest } from '../../src/provider';
import { insertToFrontMatter, getFieldValues } from '../../src/lib/frontmatter';
import { getPromptTemplate } from '../../src/provider/prompt';

// Mock dependencies
vi.mock('../../src/provider', () => ({
	processAPIRequest: vi.fn(),
}));

vi.mock('../../src/provider/prompt', () => ({
	DEFAULT_SYSTEM_ROLE: 'Test system role',
	getPromptTemplate: vi.fn().mockReturnValue('Test prompt'),
}));

vi.mock('../../src/lib/frontmatter', () => ({
	getContentWithoutFrontmatter: vi.fn().mockReturnValue('Test content'),
	getFieldValues: vi.fn().mockReturnValue(['tag1', 'tag2']),
	insertToFrontMatter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/settings/components/Notice', () => ({
	Notice: {
		error: vi.fn(),
		success: vi.fn(),
		withProgress: vi.fn(async (_fileName, _fmName, fn) => await fn()),
	},
}));

describe('ClassificationService', () => {
	let service: ClassificationService;
	let mockContext: ClassificationContext;
	let mockApp: Partial<App>;
	let mockProvider: ProviderConfig;
	let mockFrontmatter: FrontmatterField;

	beforeEach(() => {
		vi.clearAllMocks();

		mockProvider = {
			name: 'TestProvider',
			apiKey: 'test-api-key',
			baseUrl: 'https://api.test.com',
			models: [{ id: 'test-model', name: 'Test Model' }],
			temperature: 0.7,
		};

		mockApp = {
			vault: {
				read: vi.fn().mockResolvedValue('file content'),
				getMarkdownFiles: vi.fn().mockReturnValue([]),
			} as unknown as Vault,
			metadataCache: {} as MetadataCache,
			fileManager: {
				processFrontMatter: vi.fn(),
			},
		};

		mockContext = {
			app: mockApp as App,
			provider: mockProvider,
			model: 'test-model',
			classificationRule: 'test rule',
			saveSettings: vi.fn().mockResolvedValue(undefined),
			notices: {
				show: vi.fn(() => null),
				remove: vi.fn(),
				unload: vi.fn(),
			} as any,
		};

		mockFrontmatter = {
			id: 1,
			name: 'category',
			refs: ['tag1', 'tag2'],
			count: { min: 1, max: 5 },
			overwrite: false,
			linkType: 'Normal',
			customQuery: '',
		};

		service = new ClassificationService(mockContext);
	});

	describe('hasValidAuth', () => {
		it('should pass validation with API key authentication', async () => {
			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			// Should not show auth error notice
			expect(mockContext.notices.show).not.toHaveBeenCalledWith(
				'no_auth',
				expect.any(Object)
			);
		});

		it('should fail validation when API key is empty', async () => {
			const providerWithNoKey: ProviderConfig = {
				...mockProvider,
				apiKey: '',
			};
			mockContext.provider = providerWithNoKey;
			service = new ClassificationService(mockContext);

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			expect(mockContext.notices.show).toHaveBeenCalledWith(
				'no_auth',
				expect.objectContaining({
					message: expect.stringContaining('API key not configured'),
				})
			);
		});

		it('should pass validation with new auth field (apiKey type)', async () => {
			const providerWithNewAuth: ProviderConfig = {
				...mockProvider,
				apiKey: '', // Legacy field empty
				auth: { type: 'apiKey', apiKey: 'new-format-key' },
			};
			mockContext.provider = providerWithNewAuth;
			service = new ClassificationService(mockContext);

			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			// Should not show auth error notice
			expect(mockContext.notices.show).not.toHaveBeenCalledWith(
				'no_auth',
				expect.any(Object)
			);
		});

		it('should pass validation with new auth field (oauth type)', async () => {
			const oauthTokens: OAuthTokens = {
				accessToken: 'valid-token',
				refreshToken: 'refresh',
				expiresAt: Date.now() / 1000 + 3600,
				accountId: 'account-id',
			};

			const providerWithOAuth: ProviderConfig = {
				...mockProvider,
				apiKey: '',
				auth: { type: 'oauth', oauth: oauthTokens },
			};
			mockContext.provider = providerWithOAuth;
			service = new ClassificationService(mockContext);

			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			// Should not show auth error notice
			expect(mockContext.notices.show).not.toHaveBeenCalledWith(
				'no_auth',
				expect.any(Object)
			);
		});

		it('should pass validation with legacy oauth field', async () => {
			const oauthTokens: OAuthTokens = {
				accessToken: 'valid-token',
				refreshToken: 'refresh',
				expiresAt: Date.now() / 1000 + 3600,
				accountId: 'account-id',
			};

			const providerWithLegacyOAuth: ProviderConfig = {
				...mockProvider,
				apiKey: '',
				authType: 'oauth',
				oauth: oauthTokens,
			};
			mockContext.provider = providerWithLegacyOAuth;
			service = new ClassificationService(mockContext);

			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			// Should not show auth error notice
			expect(mockContext.notices.show).not.toHaveBeenCalledWith(
				'no_auth',
				expect.any(Object)
			);
		});

		it('should fail validation when OAuth provider has no tokens', async () => {
			const providerWithNoOAuth: ProviderConfig = {
				...mockProvider,
				apiKey: '',
				authType: 'oauth',
				// No oauth field
			};
			mockContext.provider = providerWithNoOAuth;
			service = new ClassificationService(mockContext);

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			expect(mockContext.notices.show).toHaveBeenCalledWith(
				'no_auth',
				expect.objectContaining({
					message: expect.stringContaining('OAuth not configured'),
				})
			);
		});

		it('should fail validation when new auth oauth type has no tokens', async () => {
			const providerWithEmptyOAuth: ProviderConfig = {
				...mockProvider,
				apiKey: '',
				auth: { type: 'oauth', oauth: undefined as any },
			};
			mockContext.provider = providerWithEmptyOAuth;
			service = new ClassificationService(mockContext);

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			expect(mockContext.notices.show).toHaveBeenCalledWith(
				'no_auth',
				expect.objectContaining({
					message: expect.stringContaining('not configured'),
				})
			);
		});
	});

	describe('classify', () => {
		it('should auto-fetch refs when empty', async () => {
			const frontmatterWithNoRefs: FrontmatterField = {
				...mockFrontmatter,
				refs: [],
			};

			getFieldValues.mockReturnValue(['fetched-tag1', 'fetched-tag2']);
			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, frontmatterWithNoRefs);

			expect(getFieldValues).toHaveBeenCalled();
			expect(mockContext.saveSettings).toHaveBeenCalled();
		});

		it('should show error when no model selected', async () => {
			mockContext.model = '';
			service = new ClassificationService(mockContext);

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			const calls = (mockContext.notices.show as ReturnType<typeof vi.fn>).mock.calls;
			expect(calls.some((call) => call[0] === 'no_model')).toBe(true);
		});

		it('should insert to frontmatter on high reliability response', async () => {
			processAPIRequest.mockResolvedValue({
				output: ['category1', 'category2'],
				reliability: 0.85,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			expect(insertToFrontMatter).toHaveBeenCalledWith(
				expect.any(Function),
				expect.objectContaining({
					file: mockFile,
					name: 'category',
					value: ['category1', 'category2'],
				})
			);
			expect(mockContext.notices.show).toHaveBeenCalledWith(
				'classify_success',
				expect.any(Object)
			);
		});

		it('should show error on low reliability response', async () => {
			processAPIRequest.mockResolvedValue({
				output: ['category1'],
				reliability: 0.1, // Below MIN_RELIABILITY_THRESHOLD (0.2)
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, mockFrontmatter);

			expect(insertToFrontMatter).not.toHaveBeenCalled();
			expect(mockContext.notices.show).toHaveBeenCalledWith(
				'low_reliability',
				expect.any(Object)
			);
		});

		it('should strip WikiLink brackets when processing refs', async () => {
			const wikiLinkFrontmatter: FrontmatterField = {
				...mockFrontmatter,
				refs: ['[[Tag1]]', '[[Tag2]]', 'Tag3'],
				linkType: 'WikiLink',
			};

			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			const mockFile = {
				name: 'test.md',
				path: 'test.md',
			} as TFile;

			await service.classify(mockFile, wikiLinkFrontmatter);

			// The getPromptTemplate should receive stripped tags
			expect(getPromptTemplate).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				['Tag1', 'Tag2', 'Tag3'], // Stripped
				expect.anything(),
				expect.anything()
			);
		});
	});
});
