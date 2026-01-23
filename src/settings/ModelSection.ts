import type { App } from 'obsidian';

import type AutoClassifierPlugin from '../main';
import { testModel } from '../provider';
import type { Model, ProviderConfig } from '../types';
import { Notice } from './components/Notice';
import { Setting } from './components/Setting';
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

		this.renderModelList(modelSection, providers, selectedModel);

		Setting.create(modelSection, {
			name: '',
			button: {
				text: '+ Add model',
				onClick: () => this.openModelModal('add'),
			},
		});
	}

	private renderModelList(
		containerEl: HTMLElement,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		const hasModels = providers.some((p) => p.models.length > 0);

		if (!hasModels) {
			const emptyState = containerEl.createEl('div', {
				cls: 'setting-item-description',
				attr: { style: 'text-align: center; padding: 1em 0;' },
			});
			emptyState.createEl('div', {
				text: 'No models configured',
				cls: 'mod-muted',
			});
			return;
		}

		providers.forEach((provider) => {
			provider.models.forEach((config: Model) => {
				const isActive =
					selectedModel === config.id && this.plugin.settings.selectedProvider === provider.name;
				const editTarget = {
					model: config.id,
					name: config.name,
					provider: provider.name,
				};

				Setting.create(containerEl, {
					name: config.name,
					desc: provider.name,
					buttons: [
						{
							icon: 'check',
							text: isActive ? 'Selected' : 'Select',
							cta: isActive,
							onClick: async () => {
								this.plugin.settings.selectedProvider = provider.name;
								this.plugin.settings.selectedModel = config.id;
								await this.plugin.saveSettings();
								this.onRefresh();
							},
						},
						{
							icon: 'check-circle',
							text: 'Test',
							onClick: async () => {
								try {
									const success = await testModel(provider, config.id);
									if (success) {
										Notice.success(`${config.name} connection test successful!`);
									} else {
										Notice.error(new Error(`${config.name} connection test failed!`));
									}
								} catch (error) {
									Notice.error(error instanceof Error ? error : new Error('Test failed'));
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
						provider.models = provider.models.filter((m) => m.id !== result.oldModel?.model);
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
					const provider = this.plugin.settings.providers.find((p) => p.name === result.provider);
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
