import AutoClassifierPlugin from 'main';
import { PluginSettingTab, Setting } from 'obsidian';
import { Provider } from '../types/interface';

import FrontMatterHandler from '../frontmatter/FrontMatterHandler';

import { addFrontmatterSetting } from 'frontmatter';
import { FrontmatterTemplate } from 'shared/constant';
import { Api } from './Api';
import { Frontmatter } from './Frontmatter';
import { Tag } from './Tag';

export interface AutoClassifierSettings {
	providers: Provider[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: FrontmatterTemplate[];
}

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	metaDataManager: FrontMatterHandler;
	apiSetting: Api;
	tagSetting: Tag;
	frontmatterSetting: Frontmatter;
	constructor(plugin: AutoClassifierPlugin, frontMatterHandler: FrontMatterHandler) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.metaDataManager = frontMatterHandler;
		this.apiSetting = new Api(plugin);
		this.tagSetting = new Tag(plugin, frontMatterHandler);
		this.frontmatterSetting = new Frontmatter(plugin, frontMatterHandler);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const apiSettingContainer = containerEl.createDiv();
		this.apiSetting.display(apiSettingContainer);

		new Setting(containerEl)
			.setName('Add frontmatter')
			.setDesc('Add a new frontmatter entry')
			.addButton((button) =>
				button
					.setButtonText('Add Frontmatter')
					.setCta()
					.onClick(() => {
						this.addNewFrontmatter(containerEl);
					})
			);

		new Setting(containerEl).setName('Tag').setHeading();
		const tagContainer = containerEl.createDiv();
		this.tagSetting.display(tagContainer);
		new Setting(containerEl).setName('Frontmatter').setHeading();

		this.plugin.settings.frontmatter.forEach((frontmatter) => {
			if (frontmatter.name !== 'tags') {
				const frontmatterContainer = containerEl.createDiv();
				this.frontmatterSetting.display(frontmatterContainer, frontmatter.id);
			}
		});
	}

	private addNewFrontmatter(containerEl: HTMLElement): void {
		const newFrontmatter = addFrontmatterSetting();
		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();

		const newFrontmatterContainer = containerEl.createDiv();
		this.frontmatterSetting.display(newFrontmatterContainer, newFrontmatter.id);
	}
}
