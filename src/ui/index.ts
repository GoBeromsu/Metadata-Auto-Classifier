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

		containerEl.createEl('h2', { text: 'Frontmatters' });
		const frontmattersContainer = containerEl.createDiv({ cls: 'frontmatters-container' });

		this.tagSetting.display(frontmattersContainer);

		this.plugin.settings.frontmatter.forEach((frontmatter) => {
			if (frontmatter.id !== 0) {
				// Skip tag setting which has id 0
				const frontmatterContainer = frontmattersContainer.createDiv({
					cls: 'frontmatter-item-container',
				});
				frontmatterContainer.setAttribute('data-frontmatter-id', frontmatter.id.toString());
				this.frontmatterSetting.display(frontmatterContainer, frontmatter.id);
			}
		});

		new Setting(frontmattersContainer).addButton((button) => {
			button
				.setIcon('plus')
				.setButtonText('Add Frontmatter')
				.onClick(() => {
					this.addNewFrontmatter(containerEl);
				});
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
			cls: 'frontmatter-item-container',
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
