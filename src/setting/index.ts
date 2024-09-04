import AutoClassifierPlugin from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";

import { MetaDataManager } from "metaDataManager";
import { APISettingTab } from "./apiSetting";

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
	frontmatter: [
		{
			name: "tags",
			refs: [] as string[],
			allowMultiple: true,
			count: 5,
		} as Frontmatter,
	],
};

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	metaDataManager: MetaDataManager;
	apiSettingTab: APISettingTab;

	constructor(app: App, plugin: AutoClassifierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.metaDataManager = new MetaDataManager(app);
		this.apiSettingTab = new APISettingTab(app, plugin);
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
		this.apiSettingTab.display();
		this.addFrontmatterSettings(containerEl);
	}

	addFrontmatterSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", { text: "Frontmatter" });

		// Tag settings (default and non-removable)
		this.addTagSettings(containerEl);

		// Add button to fetch all tags
		new Setting(containerEl)
			.setName("Fetch All Tags")
			.setDesc("Fetch all tags from your vault and save them")
			.addButton((button) =>
				button
					.setButtonText("Fetch Tags")
					.setCta()
					.onClick(async () => {
						await this.fetchAndSaveTags();
					})
			);
	}

	async fetchAndSaveTags(): Promise<void> {
		const allTags = await this.metaDataManager.getAllTags();
		const tagSetting = this.getOrCreateTagSetting();
		tagSetting.refs = allTags;
		await this.plugin.saveSettings();
		this.display();
		new Notice(`${allTags.length}개의 태그를 가져왔습니다.`);
		console.log("저장된 태그:", tagSetting.refs);
	}

	addTagSettings(containerEl: HTMLElement): void {
		const tagSetting = this.getOrCreateTagSetting();
		console.log("Current tag setting:", tagSetting);

		new Setting(containerEl)
			.setName("Tags")
			.setDesc("Default settings for automatic tagging")
			.addText((text) =>
				text
					.setPlaceholder("Tag count")
					.setValue(tagSetting.count.toString())
					.onChange(async (value) => {
						const count = parseInt(value, 10);
						if (!isNaN(count) && count > 0) {
							tagSetting.count = count;
							await this.plugin.saveSettings();
							console.log("Tag count updated:", count);
						}
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon("reset")
					.setTooltip("Set default count")
					.onClick(async () => {
						tagSetting.count =
							DEFAULT_SETTINGS.frontmatter[0].count;
						await this.plugin.saveSettings();
						this.display();
						console.log(
							"Tag count reset to default:",
							tagSetting.count
						);
					})
			);
	}

	getOrCreateTagSetting(): Frontmatter {
		let tagSetting = this.plugin.settings.frontmatter.find(
			(m) => m.name === "tags"
		);
		if (!tagSetting) {
			tagSetting = {
				name: "tags",
				refs: [],
				allowMultiple: true,
				count: 5,
			};
			this.plugin.settings.frontmatter.push(tagSetting);
		}
		return tagSetting;
	}
}
