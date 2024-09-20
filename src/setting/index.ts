import AutoClassifierPlugin from 'main';
import { PluginSettingTab, Setting } from 'obsidian';
import { Provider } from 'types/APIInterface';

import { MetaDataManager } from 'metaDataManager';

import { DEFAULT_FRONTMATTER_SETTING, Frontmatter } from 'constant';
import { APISetting } from './apiSetting';
import { FrontmatterSetting } from './frontmatterSettings';
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

		new Setting(containerEl).setName('Tag settings').setHeading();
		const tagContainer = containerEl.createDiv();
		this.tagSetting.display(tagContainer);

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
