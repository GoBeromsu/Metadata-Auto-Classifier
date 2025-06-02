import type { ProviderConfig } from 'api/types';
import type { App } from 'obsidian';
import { Modal } from 'obsidian';
import { CommonButton } from 'ui/components/common/CommonButton';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { CommonSetting, DropdownOption } from 'ui/components/common/CommonSetting';
import { getProviderPreset, getProviderPresets } from 'utils';

export class ProviderModal extends Modal {
	private readonly providerConfig: ProviderConfig;
	private readonly onSave: (provider: ProviderConfig) => void;

	constructor(
		app: App,
		onSave: (provider: ProviderConfig) => void,
		existingProvider?: ProviderConfig
	) {
		super(app);
		this.onSave = onSave;

		if (existingProvider) {
			this.providerConfig = existingProvider;
		} else {
			this.providerConfig = {
				name: 'Custom Provider',
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
		const presetOptions: DropdownOption[] = presets.map((preset) => ({
			value: preset.name,
			display: preset.name,
		}));

		// Determine current preset value
		const currentValue = this.providerConfig.name || 'Custom Provider';

		CommonSetting.create(containerEl, {
			name: 'Provider Preset',
			desc: 'Select a predefined provider',
			dropdown: {
				options: presetOptions,
				value: currentValue,
				onChange: (providerName) => {
					this.loadPresetData(providerName);
				},
			},
		});
	}

	private addProviderForm(containerEl: HTMLElement): void {
		// Provider Name - always editable, but show hint if it matches preset
		const presets = getProviderPresets();
		const isPresetProvider = presets.some((preset) => preset.name === this.providerConfig.name);

		CommonSetting.create(containerEl, {
			name: 'Provider Name',
			desc: isPresetProvider
				? 'Provider name (from preset)'
				: 'Enter a unique name for your provider',
			textInput: {
				placeholder: 'Enter provider name',
				value: this.providerConfig.name,
				disabled: false,
				onChange: (value) => {
					this.providerConfig.name = value;
				},
			},
		});

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

		const preset = presets.find((p) => p.name === this.providerConfig.name);

		CommonSetting.create(containerEl, {
			name: 'API Key',
			desc: 'Your API key for this provider',
			textInput: {
				placeholder: 'Enter API key',
				value: this.providerConfig.apiKey,
				onChange: (value) => {
					this.providerConfig.apiKey = value;
				},
			},
		});

		// Add link manually if preset has apiKeyUrl
		if (preset?.apiKeyUrl) {
			const settingEl = containerEl.querySelector(
				'.setting-item:last-child .setting-item-description'
			);
			if (settingEl) {
				const linkEl = document.createElement('a');
				linkEl.href = preset.apiKeyUrl;
				linkEl.target = '_blank';
				linkEl.style.color = 'var(--interactive-accent)';
				linkEl.style.marginLeft = '4px';
				linkEl.textContent = 'Get your API key here';
				settingEl.appendChild(linkEl);
			}
		}
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
		const preset = getProviderPreset(providerName);

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
				new Error(
					'[Provider validation] Provider name is required. Please enter a name for your provider.'
				)
			);
			return false;
		}

		// API URL validation
		if (!this.providerConfig.baseUrl.trim()) {
			CommonNotice.showError(
				new Error(
					'[Provider validation] API URL is required. Please enter a valid API endpoint URL.'
				)
			);
			return false;
		}

		// Basic URL validation
		try {
			new URL(this.providerConfig.baseUrl);
		} catch {
			CommonNotice.showError(
				new Error(
					'[URL validation] Please enter a valid URL (e.g., https://api.example.com/v1/chat/completions)'
				)
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
