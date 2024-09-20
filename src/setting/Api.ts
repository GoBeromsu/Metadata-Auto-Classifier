import { DEFAULT_MAX_TOKEN } from 'constant';
import { Notice, Setting } from 'obsidian';
import { AIFactory } from '../api';
import { Provider } from '../types/APIInterface';
import { BaseSettingStrategy } from './SettingStrategy';

export class Api extends BaseSettingStrategy {
	display(containerEl: HTMLElement): void {
		containerEl.empty();
		this.addAPIProviderSetting(containerEl);
		this.addAPIKeySetting(containerEl);
		this.addModelSetting(containerEl);
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
					await this.testAPIKey(selectedProvider);

					this.updateAPITestResult(apiKeySetting, selectedProvider);
				})
			);
	}

	private addModelSetting(containerEl: HTMLElement): void {
		const selectedProvider = this.getSelectedProvider();

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Select the model to use')
			.addDropdown((dropdown) => {
				selectedProvider.models.forEach((model) => {
					dropdown.addOption(model.name, model.name);
				});
				dropdown.setValue(this.plugin.settings.selectedModel).onChange(async (value) => {
					this.plugin.settings.selectedModel = value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName('Max tokens')
			.setDesc('Set the maximum number of tokens for the selected model')
			.addText((text) =>
				text
					.setPlaceholder('Enter max tokens')
					.setValue(selectedProvider.maxTokens?.toString() || '')
					.onChange(async (value) => {
						const maxTokens = parseInt(value);
						selectedProvider.maxTokens = maxTokens;
						await this.plugin.saveSettings();
						new Notice(`Max tokens updated to ${maxTokens}`);
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon('reset')
					.setTooltip('Set to default max tokens')
					.onClick(async () => {
						selectedProvider.maxTokens = DEFAULT_MAX_TOKEN;
						await this.plugin.saveSettings();
						new Notice(`Max tokens reset to default: ${DEFAULT_MAX_TOKEN}`);
						this.display(containerEl);
					})
			);
	}

	private getSelectedProvider(): Provider {
		return (
			this.plugin.settings.providers.find(
				(provider) => provider.name === this.plugin.settings.selectedProvider
			) || this.plugin.settings.providers[0]
		);
	}

	private async testAPIKey(provider: Provider): Promise<void> {
		try {
			const aiProvider = AIFactory.getProvider(provider.name);
			const result = await aiProvider.testAPI(provider);

			provider.testResult = result;
			provider.lastTested = new Date();

			await this.plugin.saveSettings();
		} catch (error) {
			console.error('Error occurred during API test:', error);
			provider.testResult = false;
			provider.lastTested = new Date();
			await this.plugin.saveSettings();
		}
	}

	private updateAPITestResult(apiKeySetting: Setting, provider: Provider): void {
		if (provider.lastTested) {
			const resultText = provider.testResult
				? 'Success! API is working.'
				: 'Error: API is not working.';
			const resultClass = provider.testResult ? 'api-test-success' : 'api-test-error';

			apiKeySetting.setDesc(`Last tested: ${provider.lastTested.toLocaleString()} - ${resultText}`);
			apiKeySetting.descEl.classList.add(resultClass);
		}
	}
}
