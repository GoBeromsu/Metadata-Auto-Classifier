import AutoClassifierPlugin from "main";
import { App, Notice, PluginSettingTab } from "obsidian";

import { MetaDataManager } from "metaDataManager";

import { TagSetting, DEFAULT_TAG_SETTING } from "./tagSetting";
import { APISetting } from "./apiSetting";

export interface APIProvider {
	name: string;
	apiKey: string;
	baseUrl: string;
	models: Model[];
	lastTested: Date | null;
	testResult: boolean | null;
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
	refs?: string[];
	allowMultiple: boolean;
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
				} as Model,
			],
			lastTested: null,
			testResult: null,
		},
	] as APIProvider[],
	selectedProvider: "OpenAI",
	selectedModel: "gpt-3.5-turbo",
	frontmatter: [DEFAULT_TAG_SETTING],
};

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	metaDataManager: MetaDataManager;
	apiSetting: APISetting;
	tagSetting: TagSetting;

	constructor(app: App, plugin: AutoClassifierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.metaDataManager = new MetaDataManager(app);
		this.apiSetting = new APISetting(app, plugin);
		this.tagSetting = new TagSetting(app, plugin);
	}

	async loadSettings(): Promise<void> {
		const savedData = await this.plugin.loadData();
		this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);
		await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.plugin.settings);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.apiSetting.display(containerEl);
		this.addFrontmatterSettings(containerEl);
	}

	addFrontmatterSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", { text: "Frontmatter" });
		this.tagSetting.display(containerEl);
	}
}
