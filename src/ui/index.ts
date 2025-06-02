import type AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';

import type { ProviderConfig } from 'api/types';
import type { FrontmatterTemplate } from 'frontmatter/types';
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
	frontmatter: FrontmatterTemplate[];
	classificationRule: string;
}

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	api: Api;
	tagSetting: Tag;
	frontmatterSetting: Frontmatter;

	constructor(plugin: AutoClassifierPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;

		this.api = new Api(plugin, this.containerEl);
		this.tagSetting = new Tag(plugin, this.containerEl);
		this.frontmatterSetting = new Frontmatter(plugin, this.containerEl);
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

		this.api.display();
		containerEl.createEl('h2', { text: 'Frontmatters' });

		this.tagSetting.display();

		this.plugin.settings.frontmatter.forEach((frontmatter) => {
			if (frontmatter.id !== 0) this.frontmatterSetting.display(frontmatter.id);
		});

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
		const newFrontmatter: FrontmatterTemplate = {
			id: generateId(),
			...DEFAULT_FRONTMATTER_SETTING,
		};

		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();
		this.frontmatterSetting.display(newFrontmatter.id);
	}
}

export * from './components/WikiLinkSelector';
export * from './modals/FrontmatterEditorModal';
export * from './modals/FrontmatterSelectModal';
