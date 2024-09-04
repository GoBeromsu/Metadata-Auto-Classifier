import AutoClassifierPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface APIProvider {
	name: string;
	apiKey: string;
	baseUrl: string;
	models: Model[];
}

export interface Model {
	name: string;
	maxTokens: number;
	temperature: number;
}

export interface Metadata {
	name: string;
	type: "string" | "number" | "date" | "enum";
	defaultValue: string;
	isRequired: boolean;
	allowMultiple: boolean;
}

export interface AutoClassifierSettings {
	apiProviders: APIProvider[];
	selectedProvider: string;
	selectedModel: string;
	metadata: Metadata[];
}

export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	apiProviders: [
		{
			name: "OpenAI",
			apiKey: "",
			baseUrl: "https://api.openai.com/v1",
			models: [
				{
					name: "gpt-3.5-turbo",
					maxTokens: 150,
					temperature: 0.7,
				},
			],
		},
	],
	selectedProvider: "OpenAI",
	selectedModel: "gpt-3.5-turbo",
	metadata: [
		{
			name: "tags",
			type: "string",
			defaultValue: "",
			isRequired: false,
			allowMultiple: true,
		},
	],
};

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;

	constructor(app: App, plugin: AutoClassifierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.addAPISettings(containerEl);
		this.addMetadataSettings(containerEl);
	}

	addAPISettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", { text: "API Settings" });

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

		// API Key 설정
		new Setting(containerEl)
			.setName("API Key")
			.setDesc("Enter your API key")
			.addText((text) =>
				text
					.setPlaceholder("Enter API key")
					.setValue(this.getSelectedProvider().apiKey)
					.onChange(async (value) => {
						this.getSelectedProvider().apiKey = value;
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) => button.setButtonText("Test"));

		// 모델 설정
		new Setting(containerEl)
			.setName("Model")
			.setDesc("Select the model to use")
			.addDropdown((dropdown) => {
				this.getSelectedProvider().models.forEach((model) => {
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
			) || this.plugin.settings.apiProviders[0]
		);
	}
}
