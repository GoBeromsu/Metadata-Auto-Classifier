import type { Mock } from 'vitest';
import { ProviderSection } from '../../src/settings/ProviderSection';
import type { App } from 'obsidian';
import type AutoClassifierPlugin from '../../src/main';
import type { ProviderConfig, OAuthTokens } from '../../src/types';
import { formatTokenExpiry, isTokenExpired } from '../../src/provider/auth';
import { Setting } from '../../src/settings/components/Setting';

// Mock the provider/auth module
vi.mock('../../src/provider/auth', () => ({
	formatTokenExpiry: vi.fn((tokens) => {
		const remaining = tokens.expiresAt - Math.floor(Date.now() / 1000);
		if (remaining <= 0) return 'Expired';
		const hours = Math.floor(remaining / 3600);
		const minutes = Math.floor((remaining % 3600) / 60);
		return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
	}),
	isTokenExpired: vi.fn((tokens) => {
		const buffer = 300; // 5 minutes
		return Date.now() / 1000 >= tokens.expiresAt - buffer;
	}),
}));

// Mock the ProviderModal
vi.mock('../../src/settings/modals/ProviderModal', () => ({
	ProviderModal: vi.fn().mockImplementation(() => ({
		open: vi.fn(),
	})),
}));

// Mock Setting component
vi.mock('../../src/settings/components/Setting', () => ({
	Setting: {
		create: vi.fn(),
	},
}));

describe('ProviderSection', () => {
	let providerSection: ProviderSection;
	let mockPlugin: Partial<AutoClassifierPlugin>;
	let mockApp: Partial<App>;
	let onRefresh: Mock;

	beforeEach(() => {
		vi.clearAllMocks();

		mockPlugin = {
			settings: {
				providers: [],
				selectedProvider: '',
				selectedModel: '',
				frontmatter: [],
				classificationRule: '',
			},
			saveSettings: vi.fn().mockResolvedValue(undefined),
		};

		mockApp = {};
		onRefresh = vi.fn();

		providerSection = new ProviderSection(
			mockPlugin as AutoClassifierPlugin,
			mockApp as App,
			onRefresh
		);
	});

	describe('getProviderDisplayInfo', () => {
		// Access private method via any
		const getDisplayInfo = (section: ProviderSection, provider: ProviderConfig) => {
			return (section as any).getProviderDisplayInfo(provider);
		};

		it('should return empty desc for non-OAuth provider', () => {
			const provider: ProviderConfig = {
				name: 'OpenAI',
				apiKey: 'test-key',
				baseUrl: 'https://api.openai.com',
				models: [],
			};

			const result = getDisplayInfo(providerSection, provider);

			expect(result.name).toBe('OpenAI');
			expect(result.desc).toBe('');
		});

		it('should return OAuth status for provider with authType oauth', () => {

			const oauthTokens: OAuthTokens = {
				accessToken: 'token',
				refreshToken: 'refresh',
				expiresAt: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
				accountId: 'account-id',
			};

			const provider: ProviderConfig = {
				name: 'Codex',
				apiKey: '',
				baseUrl: 'https://codex.api',
				models: [],
				authType: 'oauth',
				oauth: oauthTokens,
			};

			isTokenExpired.mockReturnValue(false);
			formatTokenExpiry.mockReturnValue('2h 0m remaining');

			const result = getDisplayInfo(providerSection, provider);

			expect(result.name).toBe('Codex');
			expect(result.desc).toContain('OAuth Connected');
			expect(result.desc).toContain('2h 0m remaining');
		});

		it('should return "OAuth Not Connected" for OAuth provider without tokens', () => {

			const provider: ProviderConfig = {
				name: 'Codex',
				apiKey: '',
				baseUrl: 'https://codex.api',
				models: [],
				authType: 'oauth',
				// No oauth field
			};

			isTokenExpired.mockReturnValue(true);

			const result = getDisplayInfo(providerSection, provider);

			expect(result.name).toBe('Codex');
			expect(result.desc).toBe('OAuth Not Connected');
		});

		it('should return "OAuth Not Connected" for expired tokens', () => {

			const expiredTokens: OAuthTokens = {
				accessToken: 'token',
				refreshToken: 'refresh',
				expiresAt: Math.floor(Date.now() / 1000) - 100, // Expired
				accountId: 'account-id',
			};

			const provider: ProviderConfig = {
				name: 'Codex',
				apiKey: '',
				baseUrl: 'https://codex.api',
				models: [],
				authType: 'oauth',
				oauth: expiredTokens,
			};

			isTokenExpired.mockReturnValue(true);

			const result = getDisplayInfo(providerSection, provider);

			expect(result.name).toBe('Codex');
			expect(result.desc).toBe('OAuth Not Connected');
		});

		it('should detect OAuth provider by oauth field even without authType', () => {

			const oauthTokens: OAuthTokens = {
				accessToken: 'token',
				refreshToken: 'refresh',
				expiresAt: Math.floor(Date.now() / 1000) + 3600,
				accountId: 'account-id',
			};

			const provider: ProviderConfig = {
				name: 'Codex',
				apiKey: '',
				baseUrl: 'https://codex.api',
				models: [],
				// No authType but has oauth
				oauth: oauthTokens,
			};

			isTokenExpired.mockReturnValue(false);
			formatTokenExpiry.mockReturnValue('1h 0m remaining');

			const result = getDisplayInfo(providerSection, provider);

			expect(result.name).toBe('Codex');
			expect(result.desc).toContain('OAuth Connected');
		});
	});

	describe('render', () => {

		it('should render provider list with Setting.create', () => {
			const providers: ProviderConfig[] = [
				{
					name: 'OpenAI',
					apiKey: 'key1',
					baseUrl: 'https://api.openai.com',
					models: [],
				},
				{
					name: 'Anthropic',
					apiKey: 'key2',
					baseUrl: 'https://api.anthropic.com',
					models: [],
				},
			];

			const mockContainer = {
				createEl: vi.fn().mockReturnValue({
					createEl: vi.fn(),
				}),
			} as unknown as HTMLElement;

			providerSection.render(mockContainer, providers);

			// Should create a div with class 'provider-section'
			expect(mockContainer.createEl).toHaveBeenCalledWith('div', { cls: 'provider-section' });

			// Should call Setting.create for each provider + 1 for "Add provider" button
			expect(Setting.create).toHaveBeenCalledTimes(3);
		});

		it('should render OAuth status in provider description', () => {

			const oauthTokens: OAuthTokens = {
				accessToken: 'token',
				refreshToken: 'refresh',
				expiresAt: Math.floor(Date.now() / 1000) + 3600,
				accountId: 'account-id',
			};

			const providers: ProviderConfig[] = [
				{
					name: 'Codex',
					apiKey: '',
					baseUrl: 'https://codex.api',
					models: [],
					authType: 'oauth',
					oauth: oauthTokens,
				},
			];

			isTokenExpired.mockReturnValue(false);
			formatTokenExpiry.mockReturnValue('1h 0m remaining');

			const mockContainer = {
				createEl: vi.fn().mockReturnValue({
					createEl: vi.fn(),
				}),
			} as unknown as HTMLElement;

			providerSection.render(mockContainer, providers);

			// Should call Setting.create with OAuth status in desc
			expect(Setting.create).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					name: 'Codex',
					desc: expect.stringContaining('OAuth Connected'),
				})
			);
		});

		it('should add "Add provider" button at the end', () => {
			const providers: ProviderConfig[] = [];

			const mockContainer = {
				createEl: vi.fn().mockReturnValue({
					createEl: vi.fn(),
				}),
			} as unknown as HTMLElement;

			providerSection.render(mockContainer, providers);

			// Should call Setting.create once for "Add provider" button
			expect(Setting.create).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					name: '',
					button: expect.objectContaining({
						text: '+ Add provider',
					}),
				})
			);
		});
	});
});
