import { App } from 'obsidian';
import { ProviderModal } from 'settings/modals/ProviderModal';
import type { ProviderConfig } from 'types';

// Mock Notice
jest.mock('settings/components/Notice', () => ({
	Notice: {
		error: jest.fn(),
		success: jest.fn(),
		validationError: jest.fn(),
		formatValidationError: jest.fn((component, message) => `[${component}] ${message}`),
	},
}));

// Mock lib
jest.mock('lib', () => ({
	getProviderPresets: jest.fn().mockReturnValue([
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
	getProviderPreset: jest.fn().mockImplementation((name: string) => ({
		name,
		baseUrl: name === 'OpenAI' ? 'https://api.openai.com/v1/chat/completions' : '',
		temperature: 0.7,
	})),
}));

describe('ProviderModal', () => {
	let mockApp: App;
	let mockOnSave: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockApp = new App();
		mockOnSave = jest.fn();
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
		const { Notice: SettingsNotice } = require('settings/components/Notice');

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
