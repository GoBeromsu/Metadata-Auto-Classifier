import { ProviderConfig } from 'utils/interface';

import AutoClassifierPlugin from 'main';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { AddModelModal } from 'ui/modals/ModelModal';
import { ProviderModal } from 'ui/modals/ProviderModal';
import { DEFAULT_TASK_TEMPLATE } from 'utils/templates';

interface ModelConfig {
	name: string;
	displayName?: string;
}

export class Api {
	protected plugin: AutoClassifierPlugin;
	private containerEl: HTMLElement | null = null;

	constructor(plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
	}

	display(containerEl: HTMLElement): void {
		this.containerEl = containerEl;
		containerEl.empty();

		// Add API section header
		containerEl.createEl('h2', { text: 'API Configuration' });
		this.addCustomPromptSetting(containerEl);

		// Provider section
		this.addProviderSection(containerEl);

		// Model section
		this.addModelSection(containerEl);
	}

	private addProviderSection(containerEl: HTMLElement): void {
		const providerSection = containerEl.createEl('div', { cls: 'provider-section' });

		// Section header
		providerSection.createEl('h3', { text: 'Providers' });

		// Provider list
		this.renderProviderList(providerSection);

		// Add provider button
		CommonSetting.create(providerSection, {
			name: '',
			button: {
				text: '+ Add provider',
				onClick: () => this.openAddProviderModal(),
			},
		});
	}

	private addCustomPromptSetting(containerEl: HTMLElement): void {
		const currentTemplate = this.plugin.settings.classificationRule ?? DEFAULT_TASK_TEMPLATE;

		CommonSetting.create(containerEl, {
			name: 'Classification Rules',
			desc: 'Customize the prompt template for classification requests',
			textArea: {
				placeholder: DEFAULT_TASK_TEMPLATE,
				value: currentTemplate,
				rows: 10,
				onChange: async (value) => {
					this.plugin.settings.classificationRule = value;
					await this.plugin.saveSettings();
				},
			},
			extraButton: {
				icon: 'reset',
				tooltip: 'Reset to default template',
				onClick: async () => {
					this.plugin.settings.classificationRule = DEFAULT_TASK_TEMPLATE;
					await this.plugin.saveSettings();
					if (this.containerEl) {
						this.display(this.containerEl);
					}
				},
			},
		});
	}

	private addModelSection(containerEl: HTMLElement): void {
		const modelSection = containerEl.createEl('div', { cls: 'model-section' });

		// Section header
		modelSection.createEl('h3', { text: 'Models' });

		// Model list
		this.renderModelList(modelSection);

		// Add model button
		CommonSetting.create(modelSection, {
			name: '',
			button: {
				text: '+ Add model',
				onClick: () => this.openAddModelModal(),
			},
		});
	}

	private renderProviderList(containerEl: HTMLElement): void {
		this.plugin.settings.providers.forEach((provider, index) => {
			const buttons = [
				{
					icon: 'pencil',
					tooltip: 'Edit',
					onClick: () => this.openEditProviderModal(provider),
				},
				{
					icon: 'trash',
					tooltip: 'Delete',
					onClick: () => this.deleteProvider(provider),
				},
			];

			CommonSetting.create(containerEl, {
				name: provider.name,
				buttons: buttons,
			});
		});
	}

	private renderModelList(containerEl: HTMLElement): void {
		const allModels: Array<{
			model: string;
			displayName: string;
			provider: string;
			isActive: boolean;
		}> = [];

		this.plugin.settings.providers.forEach((provider) => {
			provider.models.forEach((model) => {
				allModels.push({
					model: model.name,
					displayName: model.displayName || model.name,
					provider: provider.name,
					isActive: this.plugin.settings.selectedModel === model.name,
				});
			});
		});

		allModels.forEach((modelInfo, index) => {
			CommonSetting.create(containerEl, {
				name: modelInfo.displayName,
				desc: modelInfo.provider,
				toggle: {
					value: modelInfo.isActive,
					onChange: async (value) => {
						if (value) {
							// Set this model and provider as active
							this.plugin.settings.selectedModel = modelInfo.model;
							this.plugin.settings.selectedProvider = modelInfo.provider;

							await this.plugin.saveSettings();

							// Re-render to update all toggles
							this.rerenderModelSection();
						}
					},
				},
				buttons: [
					{
						icon: 'pencil',
						tooltip: 'Edit',
						onClick: () => {
							this.openEditModelModal(modelInfo);
						},
					},

					{
						icon: 'trash',
						tooltip: 'Delete',
						onClick: () => this.deleteModel(modelInfo.model, modelInfo.provider),
					},
				],
			});
		});
	}

	private rerenderModelSection(): void {
		if (!this.containerEl) return;

		const modelSection = this.containerEl.querySelector('.model-section');
		if (modelSection) {
			const modelSectionEl = modelSection as HTMLElement;
			modelSectionEl.empty();

			// Re-add section header
			modelSectionEl.createEl('h3', { text: 'Models' });

			// Re-render model list
			this.renderModelList(modelSectionEl);

			// Re-add add model button
			CommonSetting.create(modelSectionEl, {
				name: '',
				button: {
					text: '+ Add model',
					onClick: () => this.openAddModelModal(),
				},
			});
		}
	}

	private openAddProviderModal(): void {
		const modal = new ProviderModal(this.plugin, (provider: ProviderConfig) => {
			this.addProvider(provider);
		});
		modal.open();
	}

	private openEditProviderModal(provider: ProviderConfig): void {
		const modal = new ProviderModal(
			this.plugin,
			(updatedProvider: ProviderConfig) => {
				this.plugin.settings.selectedProvider = updatedProvider.name;
				this.plugin.saveSettings();
			},
			provider
		);
		modal.open();
	}

	private openAddModelModal(): void {
		const modal = new AddModelModal(this.plugin, (model: ModelConfig) => {
			this.addModel(model);
		});
		modal.open();
	}

	private openEditModelModal(modelInfo: {
		model: string;
		displayName: string;
		provider: string;
	}): void {
		const modal = new AddModelModal(
			this.plugin,
			(model: ModelConfig) => this.updateModel(modelInfo, model),
			modelInfo
		);
		modal.open();
	}

	private async addProvider(provider: ProviderConfig): Promise<void> {
		this.plugin.settings.providers.push(provider);
		await this.plugin.saveSettings();
		if (this.containerEl) {
			this.display(this.containerEl);
		}
	}

	private async deleteProvider(provider: ProviderConfig): Promise<void> {
		this.plugin.settings.providers = this.plugin.settings.providers.filter((p) => p !== provider);

		// Clear selection if deleted provider was selected
		if (this.plugin.settings.selectedProvider === provider.name) {
			this.plugin.settings.selectedProvider = '';
			this.plugin.settings.selectedModel = '';
		}

		await this.plugin.saveSettings();
		if (this.containerEl) {
			this.display(this.containerEl);
		}
	}

	private async deleteModel(modelName: string): Promise<void> {
		const selectedProvider = this.plugin.getSelectedProvider();

		selectedProvider.models = selectedProvider.models.filter((m) => m.name !== modelName);

		// Clear selection if deleted model was selected
		if (this.plugin.settings.selectedModel === modelName) {
			this.plugin.settings.selectedModel = '';
		}

		await this.plugin.saveSettings();
		this.rerenderModelSection();
	}

	private async addModel(model: ModelConfig): Promise<void> {
		const selectedProvider = this.plugin.getSelectedProvider();
		if (selectedProvider) {
			selectedProvider.models.push(model);
		}
		await this.plugin.saveSettings();
		this.rerenderModelSection();
	}

	private async updateModel(
		originalModel: { model: string; displayName: string; provider: string },
		updatedModel: ModelConfig
	): Promise<void> {
		const selectedProvider = this.plugin.getSelectedProvider();
		selectedProvider.models.push(updatedModel);

		if (this.plugin.settings.selectedModel === originalModel.model) {
			this.plugin.settings.selectedModel = updatedModel.name;
		}

		await this.plugin.saveSettings();
		this.rerenderModelSection();
	}
}
