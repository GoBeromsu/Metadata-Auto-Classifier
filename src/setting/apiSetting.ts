import { App, PluginSettingTab, Setting } from "obsidian";
import AutoClassifierPlugin from "../main";
import { APIProvider, DEFAULT_SETTINGS } from "./index";
import { AIFactory } from "../api";

export class APISettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;

	constructor(app: App, plugin: AutoClassifierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.addAPIProviderSetting(containerEl);
		this.addAPIKeySetting(containerEl);
		this.addModelSetting(containerEl);
	}

	addAPIProviderSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("API Provider")
			.setDesc("Select the API provider")
			.addDropdown((dropdown) => {
				this.plugin.settings.apiProviders.forEach((provider) => {
					dropdown.addOption(provider.name, provider.name);
				});
				dropdown
					.setValue(this.plugin.settings.selectedProvider)
					.onChange(async (value) => {
						this.plugin.settings.selectedProvider = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});
	}

	addAPIKeySetting(containerEl: HTMLElement): void {
		const selectedProvider = this.getSelectedProvider();

		const apiKeySetting = new Setting(containerEl)
			.setName("API Key")
			.setDesc("Enter your API key")
			.addText((text) =>
				text
					.setPlaceholder("Enter API key")
					.setValue(selectedProvider.apiKey)
					.onChange(async (value) => {
						selectedProvider.apiKey = value;
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) =>
				button.setButtonText("Test").onClick(async () => {
					await this.testAPIKey(selectedProvider);
				})
			);

		this.updateAPITestResult(apiKeySetting, selectedProvider);
	}

	addModelSetting(containerEl: HTMLElement): void {
		const selectedProvider = this.getSelectedProvider();

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Select the model to use")
			.addDropdown((dropdown) => {
				selectedProvider.models.forEach((model) => {
					dropdown.addOption(model.name, model.name);
				});
				dropdown
					.setValue(this.plugin.settings.selectedModel)
					.onChange(async (value) => {
						this.plugin.settings.selectedModel = value;
						await this.plugin.saveSettings();
					});
			});
	}

	getSelectedProvider(): APIProvider {
		return (
			this.plugin.settings.apiProviders.find(
				(provider) =>
					provider.name === this.plugin.settings.selectedProvider
			) || DEFAULT_SETTINGS.apiProviders[0]
		);
	}

	async testAPIKey(provider: APIProvider): Promise<void> {
		try {
			const aiProvider = AIFactory.getProvider(provider.name);
			const result = await aiProvider.testAPI(provider.apiKey);

			provider.testResult = result;
			provider.lastTested = new Date();

			await this.plugin.saveSettings();
			this.display();
		} catch (error) {
			console.error("Error occurred during API test:", error);
			provider.testResult = false;
			provider.lastTested = new Date();
			await this.plugin.saveSettings();
			this.display();
		}
	}

	updateAPITestResult(apiKeySetting: Setting, provider: APIProvider): void {
		if (provider.lastTested) {
			const resultText = provider.testResult
				? "Success! API is working."
				: "Error: API is not working.";
			const resultColor = provider.testResult
				? "var(--text-success)"
				: "var(--text-error)";

			apiKeySetting.setDesc(
				`Last tested: ${provider.lastTested.toLocaleString()} - ${resultText}`
			);
			apiKeySetting.descEl.style.color = resultColor;
		}
	}
}
