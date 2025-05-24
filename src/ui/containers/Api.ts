import { ProviderConfig } from 'utils/interface';

import AutoClassifierPlugin from 'main';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { AddModelModal } from 'ui/modals/ModelModal';
import { ProviderModal } from 'ui/modals/ProviderModal';

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
				this.updateProvider(provider, updatedProvider);
			},
			provider
		);
		modal.open();
	}

	private openAddModelModal(): void {
		const modal = new AddModelModal(this.plugin, (providerName: string, model: ModelConfig) => {
			this.addModel(providerName, model);
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
			(providerName: string, model: ModelConfig) => {
				this.updateModel(modelInfo, providerName, model);
			},
			modelInfo
		);
		modal.open();
	}

	private async addProvider(provider: ProviderConfig): Promise<void> {
		// Check for duplicate names
		const existingProvider = this.plugin.settings.providers.find((p) => p.name === provider.name);
		if (existingProvider) {
			let counter = 1;
			let newName = `${provider.name} (${counter})`;
			while (this.plugin.settings.providers.find((p) => p.name === newName)) {
				counter++;
				newName = `${provider.name} (${counter})`;
			}
			provider.name = newName;
		}

		this.plugin.settings.providers.push(provider);
		await this.plugin.saveSettings();

		if (this.containerEl) {
			this.display(this.containerEl);
		}
	}

	private async updateProvider(
		originalProvider: ProviderConfig,
		updatedProvider: ProviderConfig
	): Promise<void> {
		const index = this.plugin.settings.providers.findIndex((p) => p === originalProvider);
		if (index !== -1) {
			this.plugin.settings.providers[index] = updatedProvider;
			await this.plugin.saveSettings();

			if (this.containerEl) {
				this.display(this.containerEl);
			}
		}
	}

	private async deleteModel(modelName: string, providerName: string): Promise<void> {
		const provider = this.plugin.settings.providers.find((p) => p.name === providerName);
		if (!provider) return;

		// Remove the model from the provider
		provider.models = provider.models.filter((m) => m.name !== modelName);

		// If this was the selected model, select another one
		if (this.plugin.settings.selectedModel === modelName) {
			// Find the first available model from any provider
			let newSelectedModel = '';
			let newSelectedProvider = '';
			for (const p of this.plugin.settings.providers) {
				if (p.models.length > 0) {
					newSelectedModel = p.models[0].name;
					newSelectedProvider = p.name;
					break;
				}
			}
			this.plugin.settings.selectedModel = newSelectedModel;
			this.plugin.settings.selectedProvider = newSelectedProvider;
		}

		await this.plugin.saveSettings();
		this.rerenderModelSection();
	}

	private async addModel(providerName: string, model: ModelConfig): Promise<void> {
		const provider = this.plugin.settings.providers.find((p) => p.name === providerName);
		if (!provider) return;

		// Check for duplicate model names within the provider
		const existingModel = provider.models.find((m) => m.name === model.name);
		if (existingModel) {
			let counter = 1;
			let newName = `${model.name} (${counter})`;
			while (provider.models.find((m) => m.name === newName)) {
				counter++;
				newName = `${model.name} (${counter})`;
			}
			model.name = newName;
		}

		// Add the model to the provider
		provider.models.push(model);

		await this.plugin.saveSettings();
		this.rerenderModelSection();
	}

	private async updateModel(
		originalModel: { model: string; displayName: string; provider: string },
		providerName: string,
		updatedModel: ModelConfig
	): Promise<void> {
		// Find the original provider and model
		const originalProvider = this.plugin.settings.providers.find(
			(p) => p.name === originalModel.provider
		);
		if (!originalProvider) return;

		const modelIndex = originalProvider.models.findIndex((m) => m.name === originalModel.model);
		if (modelIndex === -1) return;

		// If provider changed, remove from old provider and add to new
		if (originalModel.provider !== providerName) {
			// Remove from original provider
			originalProvider.models.splice(modelIndex, 1);

			// Add to new provider
			const newProvider = this.plugin.settings.providers.find((p) => p.name === providerName);
			if (newProvider) {
				// Check for duplicate model names in new provider
				const existingModel = newProvider.models.find((m) => m.name === updatedModel.name);
				if (existingModel) {
					let counter = 1;
					let newName = `${updatedModel.name} (${counter})`;
					while (newProvider.models.find((m) => m.name === newName)) {
						counter++;
						newName = `${updatedModel.name} (${counter})`;
					}
					updatedModel.name = newName;
				}
				newProvider.models.push(updatedModel);
			}
		} else {
			// Same provider, just update the model
			originalProvider.models[modelIndex] = updatedModel;
		}

		// Update selected model if this was the selected one
		if (this.plugin.settings.selectedModel === originalModel.model) {
			this.plugin.settings.selectedModel = updatedModel.name;
			this.plugin.settings.selectedProvider = providerName;
		}

		await this.plugin.saveSettings();
		this.rerenderModelSection();
	}
}
