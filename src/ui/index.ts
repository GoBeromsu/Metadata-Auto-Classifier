import type AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';

import type { Model, ProviderConfig } from 'api/types';
import type { FrontmatterTemplate } from 'frontmatter/types';
import { generateId } from 'utils';
import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constants';
import { CommonSetting } from './components/common/CommonSetting';
import { Api } from './containers/Api';
import { Frontmatter } from './containers/Frontmatter';
import { Tag } from './containers/Tag';
import type { ClassificationCallbacks, ModelCallbacks, ProviderCallbacks } from './types';

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

		// Create API component with domain-specific callbacks
		const { classificationCallbacks, providerCallbacks, modelCallbacks } =
			this.createDomainCallbacks();

		this.api = new Api(
			plugin.app, // 🎯 App 객체 전달
			classificationCallbacks,
			providerCallbacks,
			modelCallbacks,
			() => this.display() // Single onRefresh callback
		);
		this.tagSetting = new Tag(plugin);
		this.frontmatterSetting = new Frontmatter(plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const apiSettingContainer = containerEl.createDiv();
		this.api.display(
			apiSettingContainer,
			this.plugin.settings.classificationRule,
			this.plugin.settings.providers,
			this.plugin.settings.selectedModel
		);

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

	private addNewFrontmatter(frontmattersContainer: HTMLElement): void {
		const newFrontmatter: FrontmatterTemplate = {
			id: generateId(),
			...DEFAULT_FRONTMATTER_SETTING,
		};

		this.plugin.settings.frontmatter.push(newFrontmatter);
		this.plugin.saveSettings();

		const newFrontmatterContainer = frontmattersContainer.createDiv({
			cls: 'frontmatter-item-container',
		});
		newFrontmatterContainer.setAttribute('data-frontmatter-id', newFrontmatter.id.toString());
		this.frontmatterSetting.display(newFrontmatterContainer, newFrontmatter.id);
	}

	private createDomainCallbacks() {
		const classificationCallbacks: ClassificationCallbacks = {
			onChange: async (rule: string) => {
				this.plugin.settings.classificationRule = rule;
				await this.plugin.saveSettings();
			},
		};

		const providerCallbacks: ProviderCallbacks = {
			onAdd: async (provider: ProviderConfig) => {
				this.plugin.settings.providers.push(provider);
				await this.plugin.saveSettings();
			},

			onUpdate: async (oldName: string, newProvider: ProviderConfig) => {
				const index = this.plugin.settings.providers.findIndex((p) => p.name === oldName);
				if (index !== -1) {
					this.plugin.settings.providers[index] = newProvider;

					// Update selection if the updated provider was selected
					if (this.plugin.settings.selectedProvider === oldName) {
						this.plugin.settings.selectedProvider = newProvider.name;
					}
				}
				await this.plugin.saveSettings();
			},

			onDelete: async (providerName: string) => {
				this.plugin.settings.providers = this.plugin.settings.providers.filter(
					(p) => p.name !== providerName
				);

				// Clear selection if deleted provider was selected
				if (this.plugin.settings.selectedProvider === providerName) {
					this.plugin.settings.selectedProvider = '';
					this.plugin.settings.selectedModel = '';
				}

				await this.plugin.saveSettings();
			},
		};

		const modelCallbacks: ModelCallbacks = {
			onAdd: async (providerName: string, model: Model) => {
				const provider = this.plugin.settings.providers.find((p) => p.name === providerName);
				if (provider) {
					provider.models.push(model);
					await this.plugin.saveSettings();
				}
			},

			onSelect: async (providerName: string, modelName: string) => {
				this.plugin.settings.selectedProvider = providerName;
				this.plugin.settings.selectedModel = modelName;
				await this.plugin.saveSettings();
			},

			onDelete: async (providerName: string, modelName: string) => {
				const provider = this.plugin.settings.providers.find((p) => p.name === providerName);

				if (provider) {
					provider.models = provider.models.filter((m) => m.name !== modelName);
				}

				await this.plugin.saveSettings();
			},
		};

		return {
			classificationCallbacks,
			providerCallbacks,
			modelCallbacks,
		};
	}
}

export * from './components/WikiLinkSelector';
export * from './modals/FrontmatterEditorModal';
export * from './modals/FrontmatterSelectModal';
