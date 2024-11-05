import { Setting } from 'obsidian';
import { ProviderConfig } from 'utils/interface';
import { ApiHandler, ApiTestResult } from '../api/ApiHandler';
import AutoClassifierPlugin from '../main';

export class Api {
	private apiHandler: ApiHandler;
	protected plugin: AutoClassifierPlugin;
	constructor(plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
		this.apiHandler = new ApiHandler();
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
					const testResult = await this.apiHandler.testAPIKey(selectedProvider);
					this.updateAPITestResult(apiKeySetting, testResult);
					await this.plugin.saveSettings();
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

	private getSelectedProvider(): ProviderConfig {
		return (
			this.plugin.settings.providers.find(
				(provider) => provider.name === this.plugin.settings.selectedProvider
			) || this.plugin.settings.providers[0]
		);
	}

	private updateAPITestResult(apiKeySetting: Setting, testResult: ApiTestResult): void {
		apiKeySetting.setDesc(
			`Last tested: ${testResult.timestamp.toLocaleString()} - ${testResult.message}`
		);
		apiKeySetting.descEl.classList.add(testResult.success ? 'api-test-success' : 'api-test-error');
	}
}
