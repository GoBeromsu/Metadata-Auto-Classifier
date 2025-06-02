import { testModel } from 'api';
import { DEFAULT_TASK_TEMPLATE } from 'api/prompt';
import type { Model, ProviderConfig } from 'api/types';
import type AutoClassifierPlugin from 'main';
import { App, TextAreaComponent } from 'obsidian';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { ModelModal, type ModelModalProps } from 'ui/modals/ModelModal';
import { ProviderModal } from 'ui/modals/ProviderModal';

export class Api {
	private currentProviders: ProviderConfig[] = [];
	private readonly containerEl: HTMLElement;

	constructor(
		private readonly app: App,
		private readonly plugin: AutoClassifierPlugin,
		containerEl: HTMLElement
	) {
		this.containerEl = containerEl;
	}

	display(): void {
		const { classificationRule, providers, selectedModel } = this.plugin.settings;
		this.currentProviders = providers;
		this.containerEl.empty();
		this.containerEl.createEl('h2', { text: 'API Configuration' });

		this.addClassificationRule(this.containerEl, classificationRule);
		this.addProviderSection(this.containerEl, providers);
		this.addModelSection(this.containerEl, providers, selectedModel);
	}

	private addProviderSection(containerEl: HTMLElement, providers: ProviderConfig[]): void {
		const providerSection = containerEl.createEl('div', { cls: 'provider-section' });
		providerSection.createEl('h3', { text: 'Providers' });

		providers.forEach((provider) => {
			CommonSetting.create(providerSection, {
				name: provider.name,
				buttons: [
					{
						icon: 'pencil',
						text: 'Edit',
						onClick: () => this.openProviderModal('edit', provider),
					},
					{
						icon: 'trash',
						text: 'Delete',
						onClick: async () => {
							this.plugin.settings.providers = this.plugin.settings.providers.filter(
								(p) => p.name !== provider.name
							);

							if (this.plugin.settings.selectedProvider === provider.name) {
								this.plugin.settings.selectedProvider = '';
								this.plugin.settings.selectedModel = '';
							}

							await this.plugin.saveSettings();
							this.display();
						},
					},
				],
			});
		});

		CommonSetting.create(providerSection, {
			name: '',
			button: {
				text: '+ Add provider',
				onClick: () => this.openProviderModal('add'),
			},
		});
	}

	private addClassificationRule(containerEl: HTMLElement, classificationRule: string): void {
		const textAreaContainer = containerEl.createDiv({ cls: 'custom-prompt-container' });
		textAreaContainer.style.width = '100%';
		textAreaContainer.style.marginTop = '8px';
		textAreaContainer.style.marginBottom = '16px';

		const textAreaComponent = new TextAreaComponent(textAreaContainer);

		CommonSetting.create(textAreaContainer, {
			name: 'Classification Rule',
			desc: 'Customize the prompt template for classification requests',
			button: {
				icon: 'reset',
				tooltip: 'Reset to default template',
				onClick: () => {
					textAreaComponent.setValue(DEFAULT_TASK_TEMPLATE);
					this.plugin.settings.classificationRule = DEFAULT_TASK_TEMPLATE;
					this.plugin.saveSettings();
					this.display();
				},
			},
		});

		textAreaComponent
			.setPlaceholder(DEFAULT_TASK_TEMPLATE)
			.setValue(classificationRule)
			.onChange(async (value) => {
				this.plugin.settings.classificationRule = value;
				await this.plugin.saveSettings();
			});

		textAreaComponent.inputEl.rows = 10;
		textAreaComponent.inputEl.style.width = '100%';
	}

	private addModelSection(
		containerEl: HTMLElement,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		const modelSection = containerEl.createEl('div', { cls: 'model-section' });
		modelSection.createEl('h3', { text: 'Models' });

		providers.forEach((provider) => {
			provider.models.forEach((config: Model) => {
				const isActive = selectedModel === config.name;
				const editTarget = {
					model: config.name,
					displayName: config.displayName,
					provider: provider.name,
				};

				CommonSetting.create(modelSection, {
					name: config.displayName,
					desc: provider.name,
					toggle: {
						value: isActive,
						onChange: async (value) => {
							if (value) {
								this.plugin.settings.selectedProvider = provider.name;
								this.plugin.settings.selectedModel = config.name;
								await this.plugin.saveSettings();
								this.display();
							}
						},
					},
					buttons: [
						{
							icon: 'check-circle',
							text: 'Test Connection',
							onClick: async () => {
								try {
									const success = await testModel(provider, config.name);
									if (success) {
										CommonNotice.showSuccess(`${config.displayName} connection test successful!`);
									} else {
										CommonNotice.showError(
											new Error(`${config.displayName} connection test failed!`)
										);
									}
								} catch (error) {
									CommonNotice.showError(error instanceof Error ? error : new Error('Test failed'));
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
								const currentProvider = this.plugin.settings.providers.find(
									(p) => p.name === provider.name
								);
								if (currentProvider) {
									currentProvider.models = currentProvider.models.filter(
										(m: Model) => m.name !== config.name
									);
								}

								if (this.plugin.settings.selectedModel === config.name) {
									this.plugin.settings.selectedProvider = '';
									this.plugin.settings.selectedModel = '';
								}

								await this.plugin.saveSettings();
								this.display();
							},
						},
					],
				});
			});
		});

		CommonSetting.create(modelSection, {
			name: '',
			button: {
				text: '+ Add model',
				onClick: () => this.openModelModal('add'),
			},
		});
	}

	private openProviderModal(type: 'add' | 'edit', providerToEdit?: ProviderConfig): void {
		const modal = new ProviderModal(
			this.app,
			async (savedProvider: ProviderConfig) => {
				if (type === 'add') {
					this.plugin.settings.providers.push(savedProvider);
				} else if (type === 'edit' && providerToEdit) {
					const index = this.plugin.settings.providers.findIndex(
						(p) => p.name === providerToEdit.name
					);
					if (index !== -1) {
						this.plugin.settings.providers[index] = savedProvider;

						if (this.plugin.settings.selectedProvider === providerToEdit.name) {
							this.plugin.settings.selectedProvider = savedProvider.name;
						}
					}
				}
				await this.plugin.saveSettings();
				this.display();
			},
			providerToEdit
		);
		modal.open();
	}

	private openModelModal(
		type: 'add' | 'edit',
		editTarget?: { model: string; displayName: string; provider: string }
	): void {
		const modalProps: ModelModalProps = {
			providers: this.currentProviders,
			onSave: async (result) => {
				if (result.isEdit && result.oldModel) {
					const provider = this.plugin.settings.providers.find(
						(p) => p.name === result.oldModel?.provider
					);
					if (provider) {
						provider.models = provider.models.filter((m) => m.name !== result.oldModel?.model);
					}

					const newProvider = this.plugin.settings.providers.find(
						(p) => p.name === result.provider
					);
					if (newProvider) {
						newProvider.models.push(result.model);
					}

					if (editTarget && editTarget.model === result.oldModel.model) {
						this.plugin.settings.selectedProvider = result.provider;
						this.plugin.settings.selectedModel = result.model.name;
					}
				} else {
					const provider = this.plugin.settings.providers.find((p) => p.name === result.provider);
					if (provider) {
						provider.models.push(result.model);
					}
				}

				await this.plugin.saveSettings();
				this.display();
			},
			editTarget: editTarget,
		};

		const modal = new ModelModal(this.app, modalProps);
		modal.open();
	}
}
