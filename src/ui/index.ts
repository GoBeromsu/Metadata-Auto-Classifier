import AutoClassifierPlugin from 'main';
import { PluginSettingTab, Setting } from 'obsidian';

import { addFrontmatterSetting } from 'frontmatter';

import { FrontmatterTemplate, ProviderConfig } from 'utils/interface';
import { Api } from './Api';
import { Frontmatter } from './Frontmatter';
import { Tag } from './Tag';

export interface AutoClassifierSettings {
	providers: ProviderConfig[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: FrontmatterTemplate[];
}

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	apiSetting: Api;
	tagSetting: Tag;
	frontmatterSetting: Frontmatter;
	constructor(plugin: AutoClassifierPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;

		this.apiSetting = new Api(plugin);
		this.tagSetting = new Tag(plugin);
		this.frontmatterSetting = new Frontmatter(plugin);
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
