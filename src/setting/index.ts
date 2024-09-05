import { Provider, Model } from 'types/APIInterface';
import AutoClassifierPlugin from 'main';
import { App, PluginSettingTab } from 'obsidian';

import { MetaDataManager } from 'metaDataManager';

import { APISetting } from './apiSetting';
import { DEFAULT_TAG_SETTING, TagSetting } from './tagSetting';

export interface AutoClassifierSettings {
	providers: Provider[];
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
	providers: [
		{
			name: 'OpenAI',
			apiKey: '',
			baseUrl: 'https://api.openai.com/v1',
			models: [
				{
					name: 'gpt-3.5-turbo',
				} as Model,
			],
			maxTokens: 2048,
			lastTested: null,
			testResult: null,
			temperature: 0.7,
		},
	] as Provider[],
	selectedProvider: 'OpenAI',
	selectedModel: 'gpt-3.5-turbo',
	frontmatter: [DEFAULT_TAG_SETTING],
};

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	metaDataManager: MetaDataManager;
	apiSetting: APISetting;
	tagSetting: TagSetting;

	constructor(plugin: AutoClassifierPlugin, metaDataManager: MetaDataManager) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.metaDataManager = metaDataManager;
		this.apiSetting = new APISetting(plugin);
		this.tagSetting = new TagSetting(plugin, metaDataManager);
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
		containerEl.createEl('h2', { text: 'Frontmatter' });
		this.tagSetting.display(containerEl);
	}
}
