import AutoClassifierPlugin from 'main';
import { PluginSettingTab, Setting } from 'obsidian';
import { Frontmatter, Provider } from 'types/APIInterface';

import { MetaDataManager } from 'metaDataManager';

import { APISetting } from './apiSetting';
import { TagSetting } from './tagSetting';
import { FrontmatterSetting } from './frontmatterSettings';
import { DEFAULT_FRONTMATTER_SETTING } from 'constant';

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

		// Add button to create new frontmatter entry
		new Setting(containerEl)
			.setName('Add Frontmatter')
			.setDesc('Add a new frontmatter entry')
			.addButton((button) =>
				button
					.setButtonText('Add Frontmatter')
					.setCta()
					.onClick(() => {
						const newFrontmatter = { ...DEFAULT_FRONTMATTER_SETTING };
						this.plugin.settings.frontmatter.push(newFrontmatter);
						this.plugin.saveSettings();

						const newFrontmatterContainer = containerEl.createDiv();
						this.frontmatterSetting.display(newFrontmatterContainer);
						this.addDeleteButton(newFrontmatterContainer);
					})
			);
		// Frontmatter Settings Sectio

		const tagSettingContainer = containerEl.createDiv();
		this.tagSetting.display(tagSettingContainer);
	}

	private addDeleteButton(container: HTMLElement): void {
		new Setting(container).addButton((button) =>
			button
				.setButtonText('Delete')
				.setWarning()
				.onClick(() => {
					// todo: 해당 프론트 매터 데이터도 사라져야 함
					container.remove();
					this.plugin.saveSettings();
				})
		);
	}
}
