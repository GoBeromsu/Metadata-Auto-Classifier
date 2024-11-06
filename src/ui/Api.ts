import { Setting } from 'obsidian';
import { ProviderConfig } from 'utils/interface';

import { validateAPIKey } from 'api';
import AutoClassifierPlugin from '../main';

export class Api {
	protected plugin: AutoClassifierPlugin;
	constructor(plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
	}

	display(containerEl: HTMLElement): void {
		containerEl.empty();
		this.addAPIProviderSetting(containerEl);
		this.addAPIKeySetting(containerEl);

		const selectedProvider = this.getSelectedProvider();

		this.addModelSetting(containerEl, selectedProvider);
		if (selectedProvider.name === 'Custom') {
			this.addBaseURLSetting(containerEl, selectedProvider);
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
					await this.plugin.saveSettings();
					this.display(containerEl);
				});
			});
	}

	private addAPIKeySetting(containerEl: HTMLElement): void {
		const selectedProvider = this.getSelectedProvider();

		const apiKeySetting = new Setting(containerEl)
			.setName('API key')
			.setDesc('Enter your API key')
			.setClass('api-key-setting')
			.addText((text) =>
				text
					.setPlaceholder('Enter API key')
					.setValue(selectedProvider.apiKey)
					.onChange(async (value) => {
						selectedProvider.apiKey = value;
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) =>
				button.setButtonText('Test').onClick(async () => {
					const testResult = await validateAPIKey(selectedProvider);
					apiKeySetting.setDesc(testResult.message);
					apiKeySetting.descEl.classList.add(
						testResult.success ? 'api-test-success' : 'api-test-error'
					);
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
						await this.plugin.saveSettings();
					});
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
		new Setting(containerEl)
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
	}

	private getSelectedProvider(): ProviderConfig {
		return (
			this.plugin.settings.providers.find(
				(provider) => provider.name === this.plugin.settings.selectedProvider
			) || this.plugin.settings.providers[0]
		);
	}
}
