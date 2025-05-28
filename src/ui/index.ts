import type AutoClassifierPlugin from 'main';
import { PluginSettingTab } from 'obsidian';

import type { ProviderConfig } from 'api/types';
import type { FrontmatterTemplate } from 'frontmatter/types';
import { generateId } from 'utils';
import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constants';
import { CommonSetting } from './components/common/CommonSetting';
import { ApiComponent } from './containers/Api';
import { Frontmatter } from './containers/Frontmatter';
import { Tag } from './containers/Tag';
import { ModelModal } from './modals/ModelModal';
import { ProviderModal } from './modals/ProviderModal';
import type { ApiProps } from './types';

export interface AutoClassifierSettings {
	providers: ProviderConfig[];
	selectedProvider: string;
	selectedModel: string;
	frontmatter: FrontmatterTemplate[];
	classificationRule: string;
}

export class AutoClassifierSettingTab extends PluginSettingTab {
	plugin: AutoClassifierPlugin;
	apiComponent: ApiComponent;
	tagSetting: Tag;
	frontmatterSetting: Frontmatter;

	constructor(plugin: AutoClassifierPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;

		// Create API component with composition pattern and event-based modal
		this.apiComponent = new ApiComponent(this.createApiProps());
		this.tagSetting = new Tag(plugin);
		this.frontmatterSetting = new Frontmatter(plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.apiComponent.updateProps(this.createApiProps());

		const apiSettingContainer = containerEl.createDiv();
		this.apiComponent.display(apiSettingContainer);

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
	private createApiProps(): ApiProps {
		return {
			// Current state (read-only)
			classificationRule: this.plugin.settings.classificationRule,
			providers: this.plugin.settings.providers,
			selectedProvider: this.plugin.settings.selectedProvider,
			selectedModel: this.plugin.settings.selectedModel,

			// State change callbacks
			onClassificationRuleChange: async (rule: string) => {
				this.plugin.settings.classificationRule = rule;
				await this.plugin.saveSettings();
			},

			onProviderAdd: async (provider: ProviderConfig) => {
				this.plugin.settings.providers.push(provider);
				await this.plugin.saveSettings();
			},

			onProviderUpdate: async (oldName: string, newProvider: ProviderConfig) => {
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

			onProviderDelete: async (providerName: string) => {
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

			onModelSelect: async (providerName: string, modelName: string) => {
				this.plugin.settings.selectedProvider = providerName;
				this.plugin.settings.selectedModel = modelName;
				await this.plugin.saveSettings();
			},

			onModelDelete: async (modelName: string) => {
				const selectedProvider = this.plugin.getSelectedProvider();
				if (selectedProvider) {
					selectedProvider.models = selectedProvider.models.filter((m) => m.name !== modelName);

					// Clear selection if deleted model was selected
					if (this.plugin.settings.selectedModel === modelName) {
						this.plugin.settings.selectedModel = '';
					}

					await this.plugin.saveSettings();
				}
			},

			// Modal event handlers (clean event-based pattern)
			onOpenProviderModal: (type: 'add' | 'edit', provider?: ProviderConfig) => {
				const modal = new ProviderModal(
					this.plugin,
					async (savedProvider: ProviderConfig) => {
						if (type === 'add') {
							this.plugin.settings.providers.push(savedProvider);
						} else if (type === 'edit' && provider) {
							const index = this.plugin.settings.providers.findIndex(
								(p) => p.name === provider.name
							);
							if (index !== -1) {
								this.plugin.settings.providers[index] = savedProvider;
								if (this.plugin.settings.selectedProvider === provider.name) {
									this.plugin.settings.selectedProvider = savedProvider.name;
								}
							}
						}
						await this.plugin.saveSettings();
						this.display();
					},
					provider
				);
				modal.open();
			},

			onOpenModelModal: (
				type: 'add' | 'edit',
				editTarget?: { model: string; displayName: string; provider: string }
			) => {
				const modal = new ModelModal(
					this.plugin,
					() => {
						this.display();
					},
					editTarget
				);
				modal.open();
			},

			// UI refresh callback
			onRefresh: () => {
				this.display(); // Re-render the entire settings tab
			},
		};
	}
}

export * from './components/WikiLinkSelector';
export * from './modals/FrontmatterEditorModal';
export * from './modals/FrontmatterSelectorModal';

