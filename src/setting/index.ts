import AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';
import { Frontmatter, Provider } from 'types/APIInterface';

import { MetaDataManager } from 'metaDataManager';

import { APISetting } from './apiSetting';
import { TagSetting } from './tagSetting';

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

	constructor(plugin: AutoClassifierPlugin, metaDataManager: MetaDataManager) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.metaDataManager = metaDataManager;
		this.apiSetting = new APISetting(plugin);
		this.tagSetting = new TagSetting(plugin, metaDataManager);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// API Settings Section
		const apiSettingContainer = containerEl.createDiv();
		this.apiSetting.display(apiSettingContainer);

		// Frontmatter Settings Section
		const frontmatterContainer = containerEl.createDiv();
		this.addFrontmatterSettings(frontmatterContainer);
	}

	addFrontmatterSettings(containerEl: HTMLElement): void {
		containerEl.empty(); // Clear existing content and redraw
		containerEl.createEl('h2', { text: 'Frontmatter' });
		this.tagSetting.display(containerEl);
	}
}
