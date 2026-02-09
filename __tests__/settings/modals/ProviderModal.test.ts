import type { Mock } from 'vitest';
import { App } from 'obsidian';
import { ProviderModal } from 'settings/modals/ProviderModal';
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
			temperature: 0.7,
			apiKeyUrl: 'https://platform.openai.com/api-keys',
		},
		{
			name: 'Custom Provider',
			baseUrl: '',
			temperature: 0.7,
		},
	]),
	getProviderPreset: vi.fn().mockImplementation((name: string) => ({
		name,
		baseUrl: name === 'OpenAI' ? 'https://api.openai.com/v1/chat/completions' : '',
		temperature: 0.7,
	})),
}));

describe('ProviderModal', () => {
	let mockApp: App;
	let mockOnSave: Mock;

	beforeEach(() => {
		vi.clearAllMocks();
		mockApp = new App();
		mockOnSave = vi.fn();
	});

	describe('Constructor', () => {
		it('should initialize with default values for new provider', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);

			expect(modal).toBeDefined();
			// Access private property via any cast
			const config = (modal as any).providerConfig;
			expect(config.name).toBe('Custom Provider');
			expect(config.apiKey).toBe('');
			expect(config.baseUrl).toBe('');
		});

		it('should initialize with existing values for edit mode', () => {
			const existingProvider: ProviderConfig = {
				name: 'My OpenAI',
				apiKey: 'sk-test-key',
				baseUrl: 'https://api.openai.com/v1/chat/completions',
				models: [],
				temperature: 0.7,
			};

			const modal = new ProviderModal(mockApp, mockOnSave, existingProvider);

			const config = (modal as any).providerConfig;
			expect(config.name).toBe('My OpenAI');
			expect(config.apiKey).toBe('sk-test-key');
			expect(config.baseUrl).toBe('https://api.openai.com/v1/chat/completions');
		});
	});

	describe('onOpen', () => {
		it('should create modal structure with accessibility attributes', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);
			modal.onOpen();

			expect(modal.contentEl.empty).toHaveBeenCalled();
			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('role', 'dialog');
			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('aria-modal', 'true');
			expect(modal.contentEl.setAttribute).toHaveBeenCalledWith('aria-label', 'Provider Settings');
		});
	});

	describe('Form Validation', () => {

		it('should show error when provider name is empty', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);
			(modal as any).providerConfig.name = '   ';

			const result = (modal as any).validateForm();

			expect(result).toBe(false);
			expect(SettingsNotice.validationError).toHaveBeenCalledWith(
				'Provider',
				expect.stringContaining('Provider name is required')
			);
		});

		it('should show error when API URL is empty', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);
			(modal as any).providerConfig.name = 'Test Provider';
			(modal as any).providerConfig.baseUrl = '';

			const result = (modal as any).validateForm();

			expect(result).toBe(false);
			expect(SettingsNotice.validationError).toHaveBeenCalledWith(
				'Provider',
				expect.stringContaining('API URL is required')
			);
		});

		it('should show error when API URL is invalid', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);
			(modal as any).providerConfig.name = 'Test Provider';
			(modal as any).providerConfig.baseUrl = 'not-a-valid-url';

			const result = (modal as any).validateForm();

			expect(result).toBe(false);
			expect(SettingsNotice.validationError).toHaveBeenCalledWith(
				'Provider',
				expect.stringContaining('valid URL')
			);
		});

		it('should pass validation when all fields are valid', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);
			(modal as any).providerConfig.name = 'Test Provider';
			(modal as any).providerConfig.baseUrl = 'https://api.example.com/v1/chat';

			const result = (modal as any).validateForm();

			expect(result).toBe(true);
		});
	});

	describe('onClose', () => {
		it('should clean up content element', () => {
			const modal = new ProviderModal(mockApp, mockOnSave);
			modal.onClose();

			expect(modal.contentEl.empty).toHaveBeenCalled();
		});
	});
});
