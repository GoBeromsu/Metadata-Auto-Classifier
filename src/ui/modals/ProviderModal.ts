import type { ProviderConfig } from 'api/types';
import type { App } from 'obsidian';
import { Modal } from 'obsidian';
import { CommonButton } from 'ui/components/common/CommonButton';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { CommonSetting, DropdownOption } from 'ui/components/common/CommonSetting';
import { findMatchingPreset, getProviderPreset, getProviderPresets } from 'utils';

export class ProviderModal extends Modal {
	private readonly providerConfig: ProviderConfig;
	private readonly onSave: (provider: ProviderConfig) => void;
	private selectedPreset: string = 'custom';

	constructor(
		app: App,
		onSave: (provider: ProviderConfig) => void,
		existingProvider?: ProviderConfig
	) {
		super(app);
		this.onSave = onSave;

		// Initialize provider config - unified approach
		if (existingProvider) {
			// Load existing data
			this.providerConfig = { ...existingProvider };
			// Try to find matching preset for existing provider
			this.selectedPreset = findMatchingPreset(existingProvider);
		} else {
			// Start with empty config
			this.providerConfig = {
				name: '',
				apiKey: '',
				baseUrl: '',
				models: [],
				temperature: 0.7,
			};
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Modal title - unified
		contentEl.createEl('h2', { text: 'Provider Settings' });

		// Always show preset selection
		this.addPresetSetting(contentEl);

		// Provider form
		this.addProviderForm(contentEl);

		// Buttons
		this.addButtons(contentEl);
	}

	private addPresetSetting(containerEl: HTMLElement): void {
		const presets = getProviderPresets();
		const presetOptions: DropdownOption[] = [
			{ value: 'custom', display: 'Custom Provider' },
			...presets.map((preset) => ({
				value: preset.id,
				display: preset.name,
			})),
		];

		CommonSetting.create(containerEl, {
			name: 'Provider Preset',
			desc: 'Select a predefined provider or choose Custom to create your own',
			dropdown: {
				options: presetOptions,
				value: this.selectedPreset,
				onChange: (providerName) => {
					if (providerName === 'custom') {
						this.selectedPreset = providerName;
						this.providerConfig.name = '';
						this.providerConfig.baseUrl = '';
						this.updateForm();
					} else {
						this.selectedPreset = providerName;
						this.loadPresetData(providerName);
					}
				},
			},
		});
	}

	private addProviderForm(containerEl: HTMLElement): void {
		// Provider Name - always show for custom, readonly for presets
		const isCustom = this.selectedPreset === 'custom';

		CommonSetting.create(containerEl, {
			name: 'Provider Name',
			desc: isCustom
				? 'Enter a unique name for your custom provider'
				: 'Provider name (from preset)',
			textInput: {
				placeholder: 'Enter provider name',
				value: this.providerConfig.name,
				disabled: !isCustom,
				onChange: (value) => {
					this.providerConfig.name = value;
				},
			},
		});

		// API URL with Obsidian TextComponent
		CommonSetting.create(containerEl, {
			name: 'API URL',
			desc: 'The complete API URL including endpoint (e.g., https://api.openai.com/v1/chat/completions)',
			textInput: {
				placeholder: 'https://api.example.com/v1/chat/completions',
				value: this.providerConfig.baseUrl,
				onChange: (value) => {
					this.providerConfig.baseUrl = value;
				},
			},
		});

		// API Key
		CommonSetting.create(containerEl, {
			name: 'API Key',
			desc: 'Your API key for this provider (leave empty if not required)',
			textInput: {
				placeholder: 'Enter API key',
				value: this.providerConfig.apiKey,
				onChange: (value) => {
					this.providerConfig.apiKey = value;
				},
			},
		});
	}

	private addButtons(containerEl: HTMLElement): void {
		const buttonContainer = containerEl.createDiv({ cls: 'button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '8px';
		buttonContainer.style.marginTop = '20px';

		CommonButton(buttonContainer, {
			text: 'Cancel',
			onClick: () => this.close(),
		});

		CommonButton(buttonContainer, {
			text: 'Save',
			cta: true,
			onClick: () => {
				if (this.validateForm()) {
					this.onSave(this.providerConfig);
					this.close();
				}
			},
		});
	}

	private loadPresetData(providerName: string): void {
		if (providerName === 'custom') {
			// For custom, keep current values or reset if needed
			// Don't automatically clear - let user decide
			return;
		}

		const preset = getProviderPreset(providerName);

		// Load preset data into current config
		this.providerConfig.name = preset.name;
		this.providerConfig.baseUrl = preset.baseUrl;
		this.providerConfig.temperature = preset.temperature;

		// Update the form to reflect new data
		this.updateForm();
	}

	private updateForm(): void {
		// Find and update form elements
		const formElements = this.contentEl.querySelectorAll('.setting-item');

		// Remove form elements (keep preset dropdown - index 0)
		for (let i = formElements.length - 1; i >= 1; i--) {
			formElements[i].remove();
		}

		// Re-add form elements with updated data
		this.addProviderForm(this.contentEl);

		// Re-add buttons
		const existingButtons = this.contentEl.querySelector('.button-container');
		if (existingButtons) {
			existingButtons.remove();
		}
		this.addButtons(this.contentEl);
	}

	private validateForm(): boolean {
		// Provider name validation
		if (!this.providerConfig.name.trim()) {
			CommonNotice.showError(
				new Error('Provider name is required. Please enter a name for your provider.'),
				'Provider validation'
			);
			return false;
		}

		// API URL validation
		if (!this.providerConfig.baseUrl.trim()) {
			CommonNotice.showError(
				new Error('API URL is required. Please enter a valid API endpoint URL.'),
				'Provider validation'
			);
			return false;
		}

		// Basic URL validation
		try {
			new URL(this.providerConfig.baseUrl);
		} catch {
			CommonNotice.showError(
				new Error('Please enter a valid URL (e.g., https://api.example.com/v1/chat/completions)'),
				'URL validation'
			);
			return false;
		}

		return true;
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
