import type AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';

import type { ProviderConfig } from 'api/types';
import type { FrontmatterField } from 'frontmatter/types';
import { generateId } from 'utils';
import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constants';
import { CommonSetting } from './components/common/CommonSetting';
import { Api } from './containers/Api';
import { Frontmatter } from './containers/Frontmatter';
import { Tag } from './containers/Tag';

export interface AutoClassifierSettings {
	providers: ProviderConfig[];
	selectedProvider: string;
	selectedModel: string;
        frontmatter: FrontmatterField[];
	classificationRule: string;
}

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	api: Api;
	tagSetting: Tag;
	frontmatterSetting: Frontmatter;

	private apiContainer: HTMLElement;
	private tagContainer: HTMLElement;
	private frontmatterContainer: HTMLElement;

	constructor(plugin: AutoClassifierPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;

		this.apiContainer = document.createElement('div');
		this.tagContainer = document.createElement('div');
		this.frontmatterContainer = document.createElement('div');

		this.api = new Api(plugin, this.apiContainer);
		this.tagSetting = new Tag(plugin, this.tagContainer);
		this.frontmatterSetting = new Frontmatter(plugin, this.frontmatterContainer);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		CommonSetting.create(containerEl, {
			name: 'Support Auto Classifier',
			desc: 'If you find Auto Classifier valuable, consider supporting its development!',
			heading: true,
			className: 'auto-classifier-settings-support',
			button: {
				text: 'Buy Me a Coffee',
				cta: true,
				onClick: () => window.open('https://www.buymeacoffee.com/gobeumsu9', '_blank'),
			},
		});

		this.apiContainer = containerEl.createDiv({ cls: 'api-section' });
		this.api = new Api(this.plugin, this.apiContainer);
		this.api.display();

		containerEl.createEl('h2', { text: 'Frontmatters' });

		this.tagContainer = containerEl.createDiv({ cls: 'tag-section' });
		this.tagSetting = new Tag(this.plugin, this.tagContainer);
		this.tagSetting.display();

		this.frontmatterContainer = containerEl.createDiv({ cls: 'frontmatter-section' });
		this.frontmatterSetting = new Frontmatter(this.plugin, this.frontmatterContainer);
		this.frontmatterSetting.display();

		const addButtonContainer = containerEl.createDiv({ cls: 'add-button-container' });
		CommonSetting.create(addButtonContainer, {
			name: '',
			button: {
				text: '+ Add frontmatter',
				onClick: () => this.addNewFrontmatter(),
			},
		});
	}

	private addNewFrontmatter(): void {
                const newFrontmatter: FrontmatterField = {
			id: generateId(),
			...DEFAULT_FRONTMATTER_SETTING,
		};

		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();
		this.frontmatterSetting.display();
	}
}

export * from './components/WikiLinkSelector';
export * from './modals/FrontmatterEditorModal';
export * from './modals/FrontmatterSelectModal';
