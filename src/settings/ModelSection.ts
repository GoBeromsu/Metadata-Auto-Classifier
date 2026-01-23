import type { App } from 'obsidian';

import type AutoClassifierPlugin from '../main';
import { testModel } from '../provider';
import type { Model, ProviderConfig } from '../types';
import { Notice } from './components/Notice';
import { DropdownOption, Setting } from './components/Setting';
import { ModelModal, type ModelModalProps } from './modals/ModelModal';

export class ModelSection {
	constructor(
		private readonly plugin: AutoClassifierPlugin,
		private readonly app: App,
		private readonly onRefresh: () => void
	) {}

	render(containerEl: HTMLElement, providers: ProviderConfig[], selectedModel: string): void {
		const modelSection = containerEl.createEl('div', { cls: 'model-section' });
		modelSection.createEl('h3', { text: 'Models' });

		this.renderModelSelectionDropdown(modelSection, providers, selectedModel);
		this.renderModelList(modelSection, providers, selectedModel);

		Setting.create(modelSection, {
			name: '',
			button: {
				text: '+ Add model',
				onClick: () => this.openModelModal('add'),
			},
		});
	}

	private renderModelSelectionDropdown(
		containerEl: HTMLElement,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		const modelOptions: DropdownOption[] = [];

		providers.forEach((provider) => {
			provider.models.forEach((model: Model) => {
				modelOptions.push({
					value: `${provider.name}::${model.id}`,
					display: `${model.name} (${provider.name})`,
				});
			});
		});

		if (modelOptions.length === 0) {
			containerEl.createEl('p', {
				text: 'No models configured. Add a model to get started.',
				cls: 'setting-item-description',
			});
			return;
		}

		const currentProvider = this.plugin.settings.selectedProvider;
		const currentValue =
			currentProvider && selectedModel ? `${currentProvider}::${selectedModel}` : '';

		Setting.create(containerEl, {
			name: 'Selected Model',
			desc: 'Choose the model to use for classification',
			dropdown: {
				options: modelOptions,
				value: currentValue,
				onChange: async (value) => {
					if (value) {
						const [providerName, modelId] = value.split('::');
						this.plugin.settings.selectedProvider = providerName;
						this.plugin.settings.selectedModel = modelId;
					} else {
						this.plugin.settings.selectedProvider = '';
						this.plugin.settings.selectedModel = '';
					}
					await this.plugin.saveSettings();
				},
			},
		});
	}

	private renderModelList(
		containerEl: HTMLElement,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		providers.forEach((provider) => {
			provider.models.forEach((config: Model) => {
				const isActive = selectedModel === config.id;
				const editTarget = {
					model: config.id,
					name: config.name,
					provider: provider.name,
				};

				const displayName = isActive ? `${config.name} ✓` : config.name;

				Setting.create(containerEl, {
					name: displayName,
					desc: provider.name,
					buttons: [
						{
							icon: 'check-circle',
							text: 'Test',
							onClick: async () => {
								try {
									const success = await testModel(provider, config.id);
									if (success) {
										Notice.success(`${config.name} connection test successful!`);
									} else {
										Notice.error(
											new Error(`${config.name} connection test failed!`)
										);
									}
								} catch (error) {
									Notice.error(
										error instanceof Error ? error : new Error('Test failed')
									);
								}
							},
						},
						{
							icon: 'pencil',
							text: 'Edit',
							onClick: () => this.openModelModal('edit', editTarget),
						},
						{
							icon: 'trash',
							text: 'Delete',
							onClick: async () => {
								const confirmed = confirm(
									`Are you sure you want to delete "${config.name}" model?`
								);
								if (!confirmed) return;

								const currentProvider = this.plugin.settings.providers.find(
									(p) => p.name === provider.name
								);
								if (currentProvider) {
									currentProvider.models = currentProvider.models.filter(
										(m: Model) => m.id !== config.id
									);
								}

								if (this.plugin.settings.selectedModel === config.id) {
									this.plugin.settings.selectedProvider = '';
									this.plugin.settings.selectedModel = '';
								}

								await this.plugin.saveSettings();
								this.onRefresh();
							},
						},
					],
				});
			});
		});
	}

	private openModelModal(
		type: 'add' | 'edit',
		editTarget?: { model: string; name: string; provider: string }
	): void {
		const modalProps: ModelModalProps = {
			providers: this.plugin.settings.providers,
			onSave: async (result) => {
				if (result.isEdit && result.oldModel) {
					const provider = this.plugin.settings.providers.find(
						(p) => p.name === result.oldModel?.provider
					);
					if (provider) {
						provider.models = provider.models.filter(
							(m) => m.id !== result.oldModel?.model
						);
					}

					const newProvider = this.plugin.settings.providers.find(
						(p) => p.name === result.provider
					);
					if (newProvider) {
						newProvider.models.push(result.model);
					}

					if (editTarget && editTarget.model === result.oldModel.model) {
						this.plugin.settings.selectedProvider = result.provider;
						this.plugin.settings.selectedModel = result.model.id;
					}
				} else {
					const provider = this.plugin.settings.providers.find(
						(p) => p.name === result.provider
					);
					if (provider) {
						provider.models.push(result.model);
					}
				}

				await this.plugin.saveSettings();
				this.onRefresh();
			},
			editTarget: editTarget,
		};

		const modal = new ModelModal(this.app, modalProps);
		modal.open();
	}
}
