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

export interface AutoClassifierSettings {
	apiProviders: APIProvider[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: Frontmatter[];
}

export interface Frontmatter {
	name: string;
	type: "string" | "number" | "date" | "enum";
	defaultValue: string;
	isRequired: boolean;
	allowMultiple: boolean;
	inputRange: "title" | "content" | "selection";
	count: number;
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
	frontmatter: [
		{
			name: "tags",
			type: "string",
			defaultValue: "",
			isRequired: false,
			allowMultiple: true,
			inputRange: "content",
			count: 1,
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
		this.addFrontmatterSettings(containerEl);
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

		// API Key Setting
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

	addFrontmatterSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", { text: "Frontmatter" });

		// Tag settings (default and non-removable)
		this.addTagSettings(containerEl);

		// Additional frontmatter fields
		this.plugin.settings.frontmatter.forEach((frontmatter, index) => {
			if (frontmatter.name !== "tag") {
				// Skip the default tag field
				this.addFrontmatterField(containerEl, frontmatter, index);
			}
		});

	addTagSettings(containerEl: HTMLElement): void {
		const tagSetting = this.plugin.settings.frontmatter.find(
			(m) => m.name === "tag"
		) || {
			name: "tag",
			type: "string",
			defaultValue: "",
			isRequired: true,
			allowMultiple: true,
			inputRange: "content",
			count: 3,
		};

		new Setting(containerEl)
			.setName("Tag Settings")
			.setDesc("Default settings for automatic tag classification")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("title", "Title")
					.addOption("content", "Content")
					.addOption("selection", "Selection")
					.setValue(tagSetting.inputRange)
					.onChange(
						async (value: "title" | "content" | "selection") => {
							tagSetting.inputRange = value;
							await this.plugin.saveSettings();
						}
					)
			)
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 1)
					.setValue(tagSetting.count)
					.setDynamicTooltip()
					.onChange(async (value) => {
						tagSetting.count = value;
						await this.plugin.saveSettings();
					})
			);

		// Check if tag setting is in the frontmatter array
		if (!this.plugin.settings.frontmatter.some((m) => m.name === "tag")) {
			this.plugin.settings.frontmatter.unshift(tagSetting);
		}
	}
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
