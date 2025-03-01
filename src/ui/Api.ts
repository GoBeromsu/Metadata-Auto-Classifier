import { Setting } from 'obsidian';
import { ProviderConfig } from 'utils/interface';

import { validateAPIKey } from 'api';
import AutoClassifierPlugin from 'main';
import { getDefaultEndpoint } from 'utils';
import { CustomFormatModal } from './CustomFormatModal';

export class Api {
	protected plugin: AutoClassifierPlugin;
	constructor(plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
	}

	display(containerEl: HTMLElement): void {
		containerEl.empty();
		// Add API section header with description
		const apiHeader = containerEl.createEl('div', { cls: 'api-section-header' });
		apiHeader.createEl('h2', { text: 'API Configuration' });
		apiHeader.createEl('p', {
			text: 'Configure your AI provider settings. Custom providers require additional configuration.',
			cls: 'api-section-description',
		});

		this.addAPIProviderSetting(containerEl);
		this.addAPIKeySetting(containerEl);
		const selectedProvider = this.getSelectedProvider();
		this.addModelSetting(containerEl, selectedProvider);

		if (selectedProvider.name === 'Custom') {
			// Add custom provider guidance section
			const customGuide = containerEl.createEl('div', { cls: 'custom-provider-guide' });
			customGuide.createEl('h3', {
				text: 'Custom Provider Configuration',
				cls: 'custom-guide-header',
			});

			this.addBaseURLSetting(containerEl, selectedProvider);
			this.addEndpointSetting(containerEl, selectedProvider);
			this.addCustomFormatSetting(containerEl, selectedProvider);
		} else {
			this.addEndpointSetting(containerEl, selectedProvider);
		}
	}

	private addAPIProviderSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('API provider')
			.setDesc('Select the API provider')
			.addDropdown((dropdown) => {
				this.plugin.settings.providers.forEach((provider) => {
					dropdown.addOption(provider.name, provider.name);
				});
				dropdown.setValue(this.plugin.settings.selectedProvider).onChange(async (value) => {
					this.plugin.settings.selectedProvider = value;
					const newProvider = this.plugin.settings.providers.find((p) => p.name === value);
					if (newProvider && newProvider.models.length > 0) {
						this.plugin.settings.selectedModel = newProvider.models[0].name;
					}
					await this.plugin.saveSettings();
					this.display(containerEl);
				});
			});
	}
	private addEndpointSetting(containerEl: HTMLElement, selectedProvider: ProviderConfig): void {
		const endpointSetting = new Setting(containerEl)
			.setName('Endpoint')
			.setDesc('Enter the endpoint for your API')
			.addText((text) => {
				const defaultEndpoint = getDefaultEndpoint(selectedProvider.name);
				return text
					.setPlaceholder(defaultEndpoint)
					.setValue(selectedProvider?.endpoint || '')
					.onChange(async (value) => {
						selectedProvider.endpoint = value;
						await this.plugin.saveSettings();
					});
			});

		// Add example for custom provider
		if (selectedProvider.name === 'Custom') {
			const endpointInfo = endpointSetting.descEl.createEl('div', { cls: 'endpoint-info' });
			endpointInfo.createEl('small', {
				text: 'Example: /v1/chat/completions or /api/generate',
				cls: 'endpoint-example',
			});
		}
	}

	private addAPIKeySetting(containerEl: HTMLElement): void {
		const selectedProvider = this.getSelectedProvider();

		const apiKeySetting = new Setting(containerEl)
			.setName('API key')
			.setDesc('Enter your API key')
			.setClass('api-key-setting')
			.addText((text) => {
				const textComponent = text
					.setPlaceholder('Enter API key')
					.setValue(selectedProvider.apiKey)
					.onChange(async (value) => {
						selectedProvider.apiKey = value;
						await this.plugin.saveSettings();
					});

				// Make it a password field
				textComponent.inputEl.type = 'password';

				// Add show/hide toggle
				const toggleBtn = textComponent.inputEl.parentElement?.createEl('button', {
					cls: 'show-hide-api-key',
					text: 'Show',
				});

				if (toggleBtn) {
					toggleBtn.addEventListener('click', (e) => {
						e.preventDefault();
						if (textComponent.inputEl.type === 'password') {
							textComponent.inputEl.type = 'text';
							toggleBtn.textContent = 'Hide';
						} else {
							textComponent.inputEl.type = 'password';
							toggleBtn.textContent = 'Show';
						}
					});
				}

				return textComponent;
			})
			.addButton((button) =>
				button.setButtonText('Test').onClick(async () => {
					button.setButtonText('Testing...');
					button.setDisabled(true);

					const testResult = await validateAPIKey(selectedProvider);

					apiKeySetting.setDesc(testResult.message);
					apiKeySetting.descEl.classList.add(
						testResult.success ? 'api-test-success' : 'api-test-error'
					);

					button.setButtonText('Test');
					button.setDisabled(false);

					await this.plugin.saveSettings();
				})
			);
	}

	private addModelSetting(containerEl: HTMLElement, selectedProvider: ProviderConfig): void {
		const setting = new Setting(containerEl).setName('Model').setDesc('Select the model to use');

		if (selectedProvider.name === 'Custom') {
			setting.addText((text) => {
				const currentModel = selectedProvider.models[0]?.name;
				return text
					.setPlaceholder('Enter model name')
					.setValue(currentModel)
					.onChange(async (value) => {
						this.plugin.settings.selectedModel = value;

						// Ensure there's at least one model in the array
						if (selectedProvider.models.length === 0) {
							selectedProvider.models.push({ name: value });
						} else {
							selectedProvider.models[0].name = value;
						}

						await this.plugin.saveSettings();
					});
			});

			// Add model info for custom provider
			const modelInfo = setting.descEl.createEl('div', { cls: 'model-info' });
			modelInfo.createEl('small', {
				text: 'Example: gpt-3.5-turbo, llama2, claude-3-opus-20240229',
				cls: 'model-example',
			});
		} else {
			setting.addDropdown((dropdown) => {
				selectedProvider.models.forEach((model) => {
					dropdown.addOption(model.name, model.name);
				});
				dropdown.setValue(this.plugin.settings.selectedModel).onChange(async (value) => {
					this.plugin.settings.selectedModel = value;
					await this.plugin.saveSettings();
				});
			});
		}
	}

	private addBaseURLSetting(containerEl: HTMLElement, selectedProvider: ProviderConfig): void {
		const baseUrlSetting = new Setting(containerEl)
			.setName('Base URL')
			.setDesc('Enter the base URL for your custom API endpoint')
			.addText((text) =>
				text
					.setPlaceholder('https://api.example.com')
					.setValue(selectedProvider.baseUrl || '')
					.onChange(async (value) => {
						selectedProvider.baseUrl = value;
						await this.plugin.saveSettings();
					})
			);

		// Add base URL info
		const baseUrlInfo = baseUrlSetting.descEl.createEl('div', { cls: 'baseurl-info' });
		baseUrlInfo.createEl('small', {
			text: 'Examples: https://api.openai.com, http://localhost:1234, https://api.anthropic.com',
			cls: 'baseurl-example',
		});
	}

	private addCustomFormatSetting(containerEl: HTMLElement, selectedProvider: ProviderConfig): void {
		const formatSetting = new Setting(containerEl)
			.setName('Custom Request Format')
			.setDesc('Configure the JSON format for API requests')
			.addButton((button) =>
				button.setButtonText('Edit Format').onClick(() => {
					const modal = new CustomFormatModal(this.plugin.app, selectedProvider, this.plugin);
					modal.open();
				})
			);

		// Add format info
		const formatInfo = formatSetting.descEl.createEl('div', { cls: 'format-info' });
		formatInfo.createEl('small', {
			text: 'Define how your request body should be structured for your API provider',
			cls: 'format-description',
		});
	}

	private getSelectedProvider(): ProviderConfig {
		return (
			this.plugin.settings.providers.find(
				(provider) => provider.name === this.plugin.settings.selectedProvider
			) || this.plugin.settings.providers[0]
		);
	}
}
