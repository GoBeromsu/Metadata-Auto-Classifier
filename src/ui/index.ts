import AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';

import { addFrontmatterSetting } from 'frontmatter';

import { ProviderConfig } from 'api/types';
import { FrontmatterTemplate } from 'frontmatter/types';
import { CommonSetting } from './components/common/CommonSetting';
import { Api } from './containers/Api';
import { Frontmatter } from './containers/Frontmatter';
import { Tag } from './containers/Tag';

export interface AutoClassifierSettings {
	providers: ProviderConfig[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: FrontmatterTemplate[];
	classificationRule: string;
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

		const addButtonContainer = containerEl.createDiv({ cls: 'add-button-container' });
		CommonSetting.create(addButtonContainer, {
			name: '',
			button: {
				text: '+ Add frontmatter',
				onClick: () => {
					this.addNewFrontmatter(frontmattersContainer);
				},
			},
		});
	}

	private addNewFrontmatter(
		frontmattersContainer: HTMLElement,
		linkType?: 'Normal' | 'WikiLink'
	): void {
		const newFrontmatter = addFrontmatterSetting(linkType);
		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();

		const newFrontmatterContainer = frontmattersContainer.createDiv({
			cls: 'frontmatter-item-container',
		});
		newFrontmatterContainer.setAttribute('data-frontmatter-id', newFrontmatter.id.toString());
		this.frontmatterSetting.display(newFrontmatterContainer, newFrontmatter.id);
	}
}

export * from './components/WikiLinkSelector';
export * from './modals/FrontmatterEditorModal';
export * from './modals/FrontmatterSelectorModal';

