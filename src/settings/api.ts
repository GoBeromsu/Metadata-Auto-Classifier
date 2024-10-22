import { Setting } from 'obsidian';
import { AIFactory } from '../api';
import { ErrorHandler } from '../error/errorHandler';
import AutoClassifierPlugin from '../main';
import { Provider } from '../types/apiInterface';

export class Api {
	protected plugin: AutoClassifierPlugin;

	constructor(plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
	}
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
			ErrorHandler.handle(error as Error, 'API Key Testing');
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
