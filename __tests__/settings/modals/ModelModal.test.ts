import { App } from 'obsidian';
import { ModelModal, ModelModalProps } from 'settings/modals/ModelModal';
import type { ProviderConfig } from 'types';
import { Notice as SettingsNotice } from 'settings/components/Notice';

// Mock Notice
vi.mock('settings/components/Notice', () => ({
	Notice: {
		error: vi.fn(),
		success: vi.fn(),
		validationError: vi.fn(),
		formatValidationError: vi.fn((component, message) => `[${component}] ${message}`),
	},
}));

// Mock lib
vi.mock('lib', () => ({
	getProviderPresets: vi.fn().mockReturnValue([
		{
			name: 'OpenAI',
			baseUrl: 'https://api.openai.com/v1/chat/completions',
			popularModels: [
				{ id: 'gpt-4', name: 'GPT-4' },
				{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
			],
		},
	]),
}));

describe('ModelModal', () => {
	let mockApp: App;
	let mockProps: ModelModalProps;
	const mockProvider: ProviderConfig = {
		name: 'OpenAI',
		apiKey: 'test-key',
		baseUrl: 'https://api.openai.com/v1/chat/completions',
		models: [],
		temperature: 0.7,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockApp = new App();
		mockProps = {
			providers: [mockProvider],
			onSave: vi.fn(),
		};
	});

	describe('Constructor', () => {
		it('should initialize with default values for new model', () => {
			const modal = new ModelModal(mockApp, mockProps);

			expect(modal).toBeDefined();
			// Access private properties via any cast for testing
			expect((modal as any).selectedProvider).toBe('OpenAI');
			expect((modal as any).modelName).toBe('');
			expect((modal as any).modelId).toBe('');
		});

		it('should initialize with existing values for edit mode', () => {
			const propsWithEdit: ModelModalProps = {
				...mockProps,
				editTarget: {
					model: 'gpt-4',
					name: 'GPT-4',
					provider: 'OpenAI',
				},
			};

			const modal = new ModelModal(mockApp, propsWithEdit);

			expect((modal as any).selectedProvider).toBe('OpenAI');
			expect((modal as any).modelName).toBe('GPT-4');
			expect((modal as any).modelId).toBe('gpt-4');
		});
	});

	describe('onOpen', () => {
		it('should create modal structure', () => {
			const modal = new ModelModal(mockApp, mockProps);
			modal.onOpen();

			// Verify contentEl was used
			expect(modal.contentEl.empty).toHaveBeenCalled();
			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('role', 'dialog');
			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('aria-modal', 'true');
		});

		it('should set correct title for new model', () => {
			const modal = new ModelModal(mockApp, mockProps);
			modal.onOpen();

			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('aria-label', 'Add Model');
		});

		it('should set correct title for edit mode', () => {
			const propsWithEdit: ModelModalProps = {
				...mockProps,
				editTarget: {
					model: 'gpt-4',
					name: 'GPT-4',
					provider: 'OpenAI',
				},
			};

			const modal = new ModelModal(mockApp, propsWithEdit);
			modal.onOpen();

			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('aria-label', 'Edit Model');
		});
	});

	describe('Form Validation', () => {

		it('should show error when provider is not selected', () => {
			const modal = new ModelModal(mockApp, mockProps);
			(modal as any).selectedProvider = '';

			const result = (modal as any).validateForm();

			expect(result).toBe(false);
			expect(SettingsNotice.validationError).toHaveBeenCalledWith('Model', 'Provider is required');
		});

		it('should show error when model ID is empty', () => {
			const modal = new ModelModal(mockApp, mockProps);
			(modal as any).modelId = '';
			(modal as any).modelName = 'Test Model';

			const result = (modal as any).validateForm();

			expect(result).toBe(false);
			expect(SettingsNotice.validationError).toHaveBeenCalledWith('Model', 'Model ID is required');
		});

		it('should show error when display name is empty', () => {
			const modal = new ModelModal(mockApp, mockProps);
			(modal as any).modelId = 'test-model';
			(modal as any).modelName = '';

			const result = (modal as any).validateForm();

			expect(result).toBe(false);
			expect(SettingsNotice.validationError).toHaveBeenCalledWith('Model', 'Display name is required');
		});

		it('should pass validation when all fields are valid', () => {
			const modal = new ModelModal(mockApp, mockProps);
			(modal as any).modelId = 'test-model';
			(modal as any).modelName = 'Test Model';
			(modal as any).selectedProvider = 'OpenAI';

			const result = (modal as any).validateForm();

			expect(result).toBe(true);
		});
	});

	describe('onClose', () => {
		it('should clean up content element', () => {
			const modal = new ModelModal(mockApp, mockProps);
			modal.onClose();

			expect(modal.contentEl.empty).toHaveBeenCalled();
		});
	});
});
