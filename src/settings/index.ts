import type AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';

import type { AutoClassifierSettings, FrontmatterField } from '../types';
import { generateId } from '../lib';
import { DEFAULT_FRONTMATTER_SETTING } from '../constants';
import { Setting } from './components/Setting';
import { Api } from './ApiSection';
import { Frontmatter } from './FrontmatterSection';
import { Tag } from './TagSection';

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

		Setting.create(containerEl, {
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
		Setting.create(addButtonContainer, {
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

export type { AutoClassifierSettings } from '../types';
export * from './components/WikiLinkSelector';
export * from './modals/FrontmatterEditorModal';
export * from './modals/FrontmatterSelectModal';
