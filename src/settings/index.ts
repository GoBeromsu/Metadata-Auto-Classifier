import AutoClassifierPlugin from 'main';
import { PluginSettingTab, Setting } from 'obsidian';
import { Provider } from 'types/apiInterface';

import FrontMatterHandler from '../frontmatterHandler';

import { DEFAULT_FRONTMATTER_SETTING, FrontmatterTemplate } from '../constant';

import { Api } from './api';
import { Frontmatter } from './frontmatter';
import { Tag } from './tag';

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
				this.addDeleteButton(frontmatterContainer, frontmatter.id);
			}
		});
	}

	private addNewFrontmatter(containerEl: HTMLElement): void {
		if (!containerEl.querySelector('h2')) {
			new Setting(containerEl).setName('Frontmatter settings').setHeading();
		}

		const newFrontmatter = { ...DEFAULT_FRONTMATTER_SETTING, id: this.generateId() };
		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();

		const newFrontmatterContainer = containerEl.createDiv();

		this.frontmatterSetting.display(newFrontmatterContainer, newFrontmatter.id);
		this.addDeleteButton(newFrontmatterContainer, newFrontmatter.id);
	}

	private generateId(): number {
		return Date.now();
	}

	private addDeleteButton(container: HTMLElement, frontmatterId: number): void {
		new Setting(container).addButton((button) =>
			button
				.setButtonText('Delete')
				.setWarning()
				.onClick(() => {
					this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
						(f) => f.id !== frontmatterId
					);
					this.plugin.saveSettings();
					container.remove();
				})
		);
	}
}
