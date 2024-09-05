import AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';
import { Frontmatter, Provider } from 'types/APIInterface';

import { MetaDataManager } from 'metaDataManager';

import { APISetting } from './apiSetting';
import { TagSetting } from './tagSetting';
import { FrontmatterSetting } from './frontmatterSettings';

export interface AutoClassifierSettings {
	providers: Provider[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: Frontmatter[];
}

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	metaDataManager: MetaDataManager;
	apiSetting: APISetting;
	tagSetting: TagSetting;
	frontmatterSetting: FrontmatterSetting;
	constructor(plugin: AutoClassifierPlugin, metaDataManager: MetaDataManager) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.metaDataManager = metaDataManager;
		this.apiSetting = new APISetting(plugin);
		this.tagSetting = new TagSetting(plugin, metaDataManager);
		this.frontmatterSetting = new FrontmatterSetting(plugin, metaDataManager);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// API Settings Section
		const apiSettingContainer = containerEl.createDiv();
		this.apiSetting.display(apiSettingContainer);

		// Frontmatter Settings Section
		containerEl.createEl('h2', { text: 'Frontmatter' });

		const tagSettingContainer = containerEl.createDiv();
		this.tagSetting.display(tagSettingContainer);

		const frontmatterContainer = containerEl.createDiv();
		this.frontmatterSetting.display(frontmatterContainer);
	}
}
