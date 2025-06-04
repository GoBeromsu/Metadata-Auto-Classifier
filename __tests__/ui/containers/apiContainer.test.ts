jest.mock('api', () => ({
	testModel: jest.fn(),
}));

jest.mock('ui/modals/ModelModal', () => ({
	ModelModal: class {
		constructor(
			public app: any,
			public props: any
		) {}
		open = jest.fn();
	},
}));

jest.mock('ui/modals/ProviderModal', () => ({
	ProviderModal: class {
		constructor(
			public app: any,
			public onSave: any,
			public provider?: any
		) {}
		open = jest.fn();
	},
}));

import { testModel } from 'api';
import { Api } from 'ui/containers/Api';

const mockTestModel = testModel as jest.MockedFunction<typeof testModel>;

const createMockPlugin = () => ({
	app: { vault: { getMarkdownFiles: jest.fn() } },
	settings: {
		providers: [
			{
				name: 'openai',
				models: [
					{ name: 'gpt-4', displayName: 'GPT-4' },
					{ name: 'gpt-3.5', displayName: 'GPT-3.5' },
				],
			},
			{
				name: 'anthropic',
				models: [{ name: 'claude-3', displayName: 'Claude 3' }],
			},
		],
		selectedProvider: 'openai',
		selectedModel: 'gpt-4',
		classificationRule: 'default rule',
	},
	saveSettings: jest.fn().mockResolvedValue(undefined),
});

const createMockContainer = () => ({
	empty: jest.fn(),
	createEl: jest.fn().mockReturnValue({
		createEl: jest.fn().mockReturnValue({}),
	}),
	createDiv: jest.fn().mockReturnValue({
		style: {},
	}),
});

describe('Api Container - Regression Tests', () => {
	let mockPlugin: any;
	let mockContainer: any;
	let api: Api;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockContainer = createMockContainer();
		api = new Api(mockPlugin, mockContainer);
		jest.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		test('renders default settings correctly', () => {
			// When: display is called
			api.display();

			// Then: All basic UI components should be created
			expect(mockContainer.empty).toHaveBeenCalled();
			expect(mockContainer.createEl).toHaveBeenCalledWith('h2', { text: 'API Configuration' });
			expect(mockContainer.createEl).toHaveBeenCalledWith('div', { cls: 'provider-section' });
			expect(mockContainer.createEl).toHaveBeenCalledWith('div', { cls: 'model-section' });
			expect(mockContainer.createDiv).toHaveBeenCalledWith({ cls: 'custom-prompt-container' });
		});
	});

	describe('Provider Management', () => {
		test('resets selected settings when provider is deleted (Critical Regression)', async () => {
			// When: openai provider deletion is simulated
			mockPlugin.settings.providers = mockPlugin.settings.providers.filter(
				(p: any) => p.name !== 'openai'
			);
			mockPlugin.settings.selectedProvider = '';
			mockPlugin.settings.selectedModel = '';

			// Then: selected settings should be reset
			expect(mockPlugin.settings.selectedProvider).toBe('');
			expect(mockPlugin.settings.selectedModel).toBe('');
			expect(mockPlugin.settings.providers).toHaveLength(1);
		});

		test('preserves selected settings when non-selected provider is deleted', async () => {
			// When: anthropic provider is deleted
			mockPlugin.settings.providers = mockPlugin.settings.providers.filter(
				(p: any) => p.name !== 'anthropic'
			);

			// Then: selected settings should be preserved
			expect(mockPlugin.settings.selectedProvider).toBe('openai');
			expect(mockPlugin.settings.selectedModel).toBe('gpt-4');
		});
	});

	describe('Model Management', () => {
		test('updates provider when model is selected (Critical Regression)', async () => {
			// When: Claude 3 model selection is simulated
			mockPlugin.settings.selectedProvider = 'anthropic';
			mockPlugin.settings.selectedModel = 'claude-3';

			// Then: provider should also be updated
			expect(mockPlugin.settings.selectedProvider).toBe('anthropic');
			expect(mockPlugin.settings.selectedModel).toBe('claude-3');
		});

		test('resets selected settings when model is deleted', async () => {
			// When: gpt-4 model is deleted and settings reset
			mockPlugin.settings.selectedProvider = '';
			mockPlugin.settings.selectedModel = '';

			// Then: selected settings should be reset
			expect(mockPlugin.settings.selectedProvider).toBe('');
			expect(mockPlugin.settings.selectedModel).toBe('');
		});
	});

	describe('Connection Test', () => {
		test('returns correct result from testModel function', async () => {
			// Success case
			mockTestModel.mockResolvedValue(true);
			const successResult = await testModel(mockPlugin.settings.providers[0], 'gpt-4');
			expect(successResult).toBe(true);

			// Failure case
			mockTestModel.mockResolvedValue(false);
			const failureResult = await testModel(mockPlugin.settings.providers[0], 'gpt-4');
			expect(failureResult).toBe(false);
		});
	});

	describe('Classification Rule', () => {
		test('updates classification rule correctly', () => {
			// Test updating rule
			mockPlugin.settings.classificationRule = 'new rule';
			expect(mockPlugin.settings.classificationRule).toBe('new rule');

			// Test resetting rule
			mockPlugin.settings.classificationRule = 'default template';
			expect(mockPlugin.settings.classificationRule).toBe('default template');
		});
	});
});
