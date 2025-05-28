import { ProviderConfig, ProviderPreset } from 'api/types';
import AutoClassifierPlugin from 'main';
import { Modal, Notice } from 'obsidian';
import { CommonButton } from 'ui/components/common/CommonButton';
import { CommonSetting, DropdownOption } from 'ui/components/common/CommonSetting';

// Import providers data
const providersData = require('../../api/providerPreset.json');

export class ProviderModal extends Modal {
	private plugin: AutoClassifierPlugin;
	private providerConfig: ProviderConfig;
	private onSave: (provider: ProviderConfig) => void;
	private selectedPreset: string = 'custom';

	constructor(
		plugin: AutoClassifierPlugin,
		onSave: (provider: ProviderConfig) => void,
		existingProvider?: ProviderConfig
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSave = onSave;

		// Initialize provider config - unified approach
		if (existingProvider) {
			// Load existing data
			this.providerConfig = { ...existingProvider };
			// Try to find matching preset for existing provider
			this.findMatchingPreset(existingProvider);
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

	private findMatchingPreset(existingProvider: ProviderConfig): void {
		// Try to find a preset that matches the existing provider
		const matchingPreset = Object.values(providersData).find((preset: any) => {
			const typedPreset = preset as ProviderPreset;
			return (
				typedPreset.baseUrl === existingProvider.baseUrl ||
				typedPreset.name === existingProvider.name
			);
		}) as ProviderPreset | undefined;

		if (matchingPreset) {
			this.selectedPreset = matchingPreset.id;
		} else {
			this.selectedPreset = 'custom';
		}
	}

	private addPresetSetting(containerEl: HTMLElement): void {
		const presetOptions: DropdownOption[] = [
			...Object.values(providersData).map((preset: ProviderPreset) => ({
				value: preset.id,
				display: preset.name,
			})),
			{ value: 'custom', display: 'Custom Provider' },
		];

		CommonSetting.create(containerEl, {
			name: 'Provider Preset',
			desc: 'Select a predefined provider or choose Custom to create your own',
			dropdown: {
				options: presetOptions,
				value: this.selectedPreset,
				onChange: (value) => {
					this.selectedPreset = value;
					this.loadPresetData(value);
				},
			},
		});
	}

	private addProviderForm(containerEl: HTMLElement): void {
		// API URL
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

		new CommonButton(buttonContainer, {
			text: 'Cancel',
			onClick: () => this.close(),
		});

		new CommonButton(buttonContainer, {
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

	private loadPresetData(presetId: string): void {
		if (presetId === 'custom') {
			// For custom, keep current values or reset if needed
			// Don't automatically clear - let user decide
			return;
		}

		const preset = providersData[presetId] as ProviderPreset;
		if (!preset) return;

		// Load preset data into current config
		this.providerConfig.name = preset.name;
		this.providerConfig.baseUrl = preset.baseUrl;
		// Keep existing API key - don't overwrite user's key

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
		if (!this.providerConfig.name.trim()) {
			new Notice('Provider name is required');
			return false;
		}

		if (!this.providerConfig.baseUrl.trim()) {
			new Notice('API URL is required');
			return false;
		}

		// Basic URL validation
		try {
			new URL(this.providerConfig.baseUrl);
		} catch {
			new Notice('Please enter a valid URL');
			return false;
		}

		return true;
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
