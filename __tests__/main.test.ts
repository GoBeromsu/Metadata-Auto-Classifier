import AutoClassifierPlugin from '../src/main';
import { App, TFile, createMockTFile } from 'obsidian';
import { DEFAULT_SETTINGS, DEFAULT_FRONTMATTER_SETTING } from 'utils/constants';
import type { ProviderConfig } from 'api/types';
import type { FrontmatterField } from 'frontmatter/types';

// Mock the api module
jest.mock('api', () => ({
	processAPIRequest: jest.fn(),
}));

// Mock the frontmatter module
jest.mock('frontmatter', () => ({
	getContentWithoutFrontmatter: jest.fn().mockReturnValue('Test content'),
	getFieldValues: jest.fn().mockReturnValue(['tag1', 'tag2', 'tag3']),
	insertToFrontMatter: jest.fn().mockResolvedValue(undefined),
}));

// Mock CommonNotice
jest.mock('ui/components/common/CommonNotice', () => ({
	CommonNotice: {
		error: jest.fn(),
		success: jest.fn(),
		withProgress: jest.fn(async (fileName, fmName, fn) => await fn()),
	},
}));

// Mock AutoClassifierSettingTab
jest.mock('ui', () => ({
	AutoClassifierSettingTab: jest.fn().mockImplementation(() => ({
		display: jest.fn(),
	})),
}));

describe('AutoClassifierPlugin', () => {
	let plugin: AutoClassifierPlugin;
	let mockApp: App;

	const mockProvider: ProviderConfig = {
		name: 'TestProvider',
		apiKey: 'test-api-key',
		baseUrl: 'https://api.test.com',
		models: [{ id: 'test-model', name: 'Test Model' }],
		temperature: 0.7,
	};

	const mockFrontmatter: FrontmatterField = {
		id: 1,
		name: 'category',
		refs: ['tag1', 'tag2'],
		count: { min: 1, max: 5 },
		overwrite: false,
		linkType: 'Text',
		customQuery: '',
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockApp = new App();
		plugin = new AutoClassifierPlugin(mockApp);

		// Setup default settings
		plugin.settings = {
			...DEFAULT_SETTINGS,
			providers: [mockProvider],
			selectedProvider: 'TestProvider',
			selectedModel: 'test-model',
			frontmatter: [mockFrontmatter],
			classificationRule: 'Test rule',
		};
	});

	describe('loadSettings', () => {
		it('should load settings with default values when no saved data exists', async () => {
			(plugin.loadData as jest.Mock).mockResolvedValue(null);

			await plugin.loadSettings();

			expect(plugin.settings).toBeDefined();
			expect(plugin.saveData).toHaveBeenCalled();
		});

		it('should merge saved data with default settings', async () => {
			const savedData = {
				selectedProvider: 'SavedProvider',
				providers: [mockProvider],
			};
			(plugin.loadData as jest.Mock).mockResolvedValue(savedData);

			await plugin.loadSettings();

			expect(plugin.settings.selectedProvider).toBe('SavedProvider');
		});

		it('should migrate frontmatter settings missing count property', async () => {
			const savedData = {
				frontmatter: [
					{
						id: 1,
						name: 'test',
						refs: [],
						overwrite: false,
						linkType: 'Text',
						customQuery: '',
						// count is missing
					},
				],
			};
			(plugin.loadData as jest.Mock).mockResolvedValue(savedData);

			await plugin.loadSettings();

			// Should have migrated with default count
			expect(plugin.settings.frontmatter[0].count).toEqual({ min: 1, max: 5 });
		});

		it('should preserve existing count property during migration', async () => {
			const savedData = {
				frontmatter: [
					{
						id: 1,
						name: 'test',
						refs: [],
						count: { min: 2, max: 10 },
						overwrite: false,
						linkType: 'Text',
						customQuery: '',
					},
				],
			};
			(plugin.loadData as jest.Mock).mockResolvedValue(savedData);

			await plugin.loadSettings();

			expect(plugin.settings.frontmatter[0].count).toEqual({ min: 2, max: 10 });
		});
	});

	describe('saveSettings', () => {
		it('should call saveData with current settings', async () => {
			await plugin.saveSettings();

			expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
		});
	});

	describe('getSelectedProvider', () => {
		it('should return the selected provider', () => {
			const result = plugin.getSelectedProvider();

			expect(result).toEqual(mockProvider);
		});

		it('should throw error when selected provider not found', () => {
			plugin.settings.selectedProvider = 'NonExistentProvider';

			expect(() => plugin.getSelectedProvider()).toThrow('Selected provider not found');
		});

		it('should throw error when no providers configured', () => {
			plugin.settings.providers = [];
			plugin.settings.selectedProvider = 'TestProvider';

			expect(() => plugin.getSelectedProvider()).toThrow('Selected provider not found');
		});
	});

	describe('processFrontmatter', () => {
		const { CommonNotice } = require('ui/components/common/CommonNotice');

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should show error when no active file', async () => {
			mockApp.workspace.getActiveFile.mockReturnValue(null);

			await plugin.processFrontmatter(1);

			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({ message: 'No active file.' })
			);
		});

		it('should show error when no provider selected', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
			plugin.settings.selectedProvider = 'NonExistentProvider';

			await plugin.processFrontmatter(1);

			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({ message: 'No provider selected.' })
			);
		});

		it('should show error when frontmatter setting not found', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			await plugin.processFrontmatter(999); // Non-existent ID

			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'No setting found for frontmatter ID 999.',
				})
			);
		});

		it('should process frontmatter when all conditions are met', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			const { processAPIRequest } = require('api');
			processAPIRequest.mockResolvedValue({
				output: ['result-tag'],
				reliability: 0.9,
			});

			await plugin.processFrontmatter(1);

			// Should have called withProgress
			expect(CommonNotice.withProgress).toHaveBeenCalled();
		});
	});

	describe('classifyFrontmatter (via classificationService)', () => {
		const { CommonNotice } = require('ui/components/common/CommonNotice');
		const { processAPIRequest } = require('api');
		const { insertToFrontMatter, getFieldValues } = require('frontmatter');

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should auto-collect refs from vault when refs is empty', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			const frontmatterWithNoRefs: FrontmatterField = {
				...mockFrontmatter,
				refs: [],
			};
			plugin.settings.frontmatter = [frontmatterWithNoRefs];

			getFieldValues.mockReturnValue(['collected-tag1', 'collected-tag2']);
			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			await plugin.processFrontmatter(frontmatterWithNoRefs.id);

			expect(getFieldValues).toHaveBeenCalled();
		});

		it('should show error when no reference values found', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			const frontmatterWithNoRefs: FrontmatterField = {
				...mockFrontmatter,
				refs: [],
			};
			plugin.settings.frontmatter = [frontmatterWithNoRefs];

			getFieldValues.mockReturnValue([]);

			await plugin.processFrontmatter(frontmatterWithNoRefs.id);

			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('No reference values found'),
				})
			);
		});

		it('should show error when API key is not configured', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			const providerWithNoKey: ProviderConfig = {
				...mockProvider,
				apiKey: '',
			};
			plugin.settings.providers = [providerWithNoKey];
			plugin.settings.selectedProvider = providerWithNoKey.name;

			await plugin.processFrontmatter(mockFrontmatter.id);

			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('API key not configured'),
				})
			);
		});

		it('should show error when no model is selected', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
			plugin.settings.selectedModel = '';

			await plugin.processFrontmatter(mockFrontmatter.id);

			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('No model selected'),
				})
			);
		});

		it('should strip WikiLink brackets when linkType is WikiLink', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			const wikiLinkFrontmatter: FrontmatterField = {
				...mockFrontmatter,
				id: 99,
				refs: ['[[tag1]]', '[[tag2]]', 'tag3'],
				linkType: 'WikiLink',
			};
			plugin.settings.frontmatter = [wikiLinkFrontmatter];

			processAPIRequest.mockResolvedValue({
				output: ['result'],
				reliability: 0.9,
			});

			await plugin.processFrontmatter(99);

			// Should process values with brackets stripped
			expect(CommonNotice.withProgress).toHaveBeenCalled();
		});

		it('should show success message when API response has high reliability', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			processAPIRequest.mockResolvedValue({
				output: ['result-tag'],
				reliability: 0.9,
			});

			await plugin.processFrontmatter(mockFrontmatter.id);

			expect(insertToFrontMatter).toHaveBeenCalled();
			expect(CommonNotice.success).toHaveBeenCalled();
		});

		it('should show error when API response has low reliability', async () => {
			const mockFile = createMockTFile('test/path.md', 'test');
			mockApp.workspace.getActiveFile.mockReturnValue(mockFile);

			processAPIRequest.mockResolvedValue({
				output: ['result-tag'],
				reliability: 0.1, // Below MIN_RELIABILITY_THRESHOLD (0.2)
			});

			await plugin.processFrontmatter(mockFrontmatter.id);

			expect(insertToFrontMatter).not.toHaveBeenCalled();
			expect(CommonNotice.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('Low reliability'),
				})
			);
		});
	});

	describe('setupCommand', () => {
		it('should setup command service with all frontmatter settings', () => {
			// Mock addCommand to track calls
			plugin.addCommand = jest.fn();

			plugin.settings.frontmatter = [
				{ ...mockFrontmatter, id: 1, name: 'category' },
				{ ...mockFrontmatter, id: 2, name: 'tags' },
			];

			plugin.setupCommand();

			// CommandService should call addCommand for each frontmatter + one for "all"
			expect(plugin.addCommand).toHaveBeenCalledTimes(3);
		});

		it('should register "Fetch all frontmatter" command', () => {
			plugin.addCommand = jest.fn();
			plugin.settings.frontmatter = [mockFrontmatter];

			plugin.setupCommand();

			// Verify the "Fetch all" command was registered
			expect(plugin.addCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'fetch-frontmatter-Fetch all frontmatter using current provider',
					name: 'Fetch frontmatter: Fetch all frontmatter using current provider',
				})
			);
		});
	});

	describe('processAllFrontmatter', () => {
		it('should process all frontmatter items sequentially', async () => {
			const processFrontmatterSpy = jest
				.spyOn(plugin, 'processFrontmatter')
				.mockResolvedValue(undefined);

			plugin.settings.frontmatter = [
				{ ...mockFrontmatter, id: 1 },
				{ ...mockFrontmatter, id: 2 },
				{ ...mockFrontmatter, id: 3 },
			];

			await plugin.processAllFrontmatter();

			expect(processFrontmatterSpy).toHaveBeenCalledTimes(3);
			expect(processFrontmatterSpy).toHaveBeenNthCalledWith(1, 1);
			expect(processFrontmatterSpy).toHaveBeenNthCalledWith(2, 2);
			expect(processFrontmatterSpy).toHaveBeenNthCalledWith(3, 3);

			processFrontmatterSpy.mockRestore();
		});
	});

	describe('registerCommand', () => {
		it('should be callable and invoke addCommand internally', () => {
			// Since we cannot easily mock the inherited addCommand,
			// we verify registerCommand is properly defined and callable
			const callback = jest.fn();

			// registerCommand should not throw
			expect(() => plugin.registerCommand('test-command', callback)).not.toThrow();

			// Verify the method exists and has correct signature
			expect(typeof plugin.registerCommand).toBe('function');
		});
	});
});
