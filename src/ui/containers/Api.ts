import { ModelInfo, ProviderConfig } from 'utils/interface';

import AutoClassifierPlugin from 'main';
import { Setting, TextAreaComponent } from 'obsidian';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { ModelModal } from 'ui/modals/ModelModal';
import { ProviderModal } from 'ui/modals/ProviderModal';
import { DEFAULT_TASK_TEMPLATE } from 'utils/templates';

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
				onClick: () => {
					const modal = new ProviderModal(this.plugin, (provider: ProviderConfig) => {
						this.addProvider(provider);
					});
					modal.open();
				},
			},
		});
	}

	private addCustomPromptSetting(containerEl: HTMLElement): void {
		const currentTemplate = this.plugin.settings.classificationRule;

		new Setting(containerEl)
			.setName('Classification Rules')
			.setDesc('Customize the prompt template for classification requests')
			.addExtraButton((button) =>
				button
					.setIcon('reset')
					.setTooltip('Reset to default template')
					.onClick(async () => {
						this.plugin.settings.classificationRule = DEFAULT_TASK_TEMPLATE;
						textAreaComponent.setValue(DEFAULT_TASK_TEMPLATE);
						await this.plugin.saveSettings();
						this.display(containerEl);
					})
			);

		// Create a container for the textarea below the setting
		const textAreaContainer = containerEl.createDiv({ cls: 'custom-prompt-container' });
		textAreaContainer.style.width = '100%';
		textAreaContainer.style.marginTop = '8px';
		textAreaContainer.style.marginBottom = '16px';

		// Create the TextAreaComponent in the dedicated container
		const textAreaComponent = new TextAreaComponent(textAreaContainer)
			.setPlaceholder(DEFAULT_TASK_TEMPLATE)
			.setValue(currentTemplate)
			.onChange(async (value) => {
				this.plugin.settings.classificationRule = value;
				await this.plugin.saveSettings();
			});

		// Set the text area dimensions
		textAreaComponent.inputEl.rows = 10;
		textAreaComponent.inputEl.style.width = '100%';
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
		this.plugin.settings.providers.forEach((provider) => {
			provider.models.forEach((config: ModelInfo) => {
				const isActive = this.plugin.settings.selectedModel === config.name;
				const editTarget = {
					model: config.name,
					displayName: config.displayName,
					provider: provider.name,
				};
				CommonSetting.create(containerEl, {
					name: config.displayName,
					desc: provider.name,
					toggle: {
						value: isActive,
						onChange: async (value) => {
							if (value) {
								this.plugin.settings.selectedModel = config.name;
								this.plugin.settings.selectedProvider = provider.name;

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
								const modal = new ModelModal(
									this.plugin,
									() => this.rerenderModelSection(),
									editTarget
								);
								modal.open();
							},
						},
						{
							icon: 'trash',
							tooltip: 'Delete',
							onClick: () => this.deleteModel(config.name),
						},
					],
				});
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
		const modal = new ModelModal(this.plugin, () => {
			this.rerenderModelSection();
		});
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
}
