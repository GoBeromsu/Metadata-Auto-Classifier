import AutoClassifierPlugin from 'main';
import { PluginSettingTab, ButtonComponent, Setting } from 'obsidian';

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

		// API Settings Section
		const apiSettingContainer = containerEl.createDiv();
		this.apiSetting.display(apiSettingContainer);

		// Tags section
		const tagSectionContainer = containerEl.createDiv({ cls: 'section-container tag-section' });
		new Setting(tagSectionContainer).setName('Tags').setHeading().setClass('section-heading');

		const tagContainer = tagSectionContainer.createDiv();
		this.tagSetting.display(tagContainer);

		// Custom frontmatter section
		const fmSectionContainer = containerEl.createDiv({
			cls: 'section-container frontmatter-section',
		});

		const fmHeaderContainer = fmSectionContainer.createDiv({ cls: 'section-header-container' });

		new Setting(fmHeaderContainer)
			.setName('Custom Frontmatter')
			.setHeading()
			.setClass('section-heading')
			.addButton((button) => {
				button
					.setIcon('plus')
					.setButtonText('Add Frontmatter')
					.setCta()
					.onClick(() => {
						this.addNewFrontmatter(containerEl);
					});
			});

		// Create a container for all frontmatter items
		const frontmattersContainer = fmSectionContainer.createDiv({ cls: 'frontmatters-container' });

		this.plugin.settings.frontmatter.forEach((frontmatter) => {
			if (frontmatter.name !== 'tags') {
				const frontmatterContainer = frontmattersContainer.createDiv({
					cls: 'frontmatter-item-container',
				});
				frontmatterContainer.setAttribute('data-frontmatter-id', frontmatter.id.toString());
				this.frontmatterSetting.display(frontmatterContainer, frontmatter.id);
			}
		});
	}

	private addNewFrontmatter(containerEl: HTMLElement, linkType?: 'Normal' | 'WikiLink'): void {
		const newFrontmatter = addFrontmatterSetting(linkType);
		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();

		// Find the frontmatters container to add the new frontmatter to
		const frontmattersContainer = containerEl.querySelector('.frontmatters-container');
		if (!frontmattersContainer) return;

		const newFrontmatterContainer = frontmattersContainer.createDiv({
			cls: 'frontmatter-container',
		});

		newFrontmatterContainer.setAttribute('data-frontmatter-id', newFrontmatter.id.toString());
		this.frontmatterSetting.display(newFrontmatterContainer, newFrontmatter.id);

		newFrontmatterContainer.scrollIntoView({ block: 'center' });

		newFrontmatterContainer.addClass('newly-added');
		setTimeout(() => newFrontmatterContainer.removeClass('newly-added'), 2000);
	}
}

export * from './SelectFrontmatterModal';
export * from './WikiLinkSelector';
