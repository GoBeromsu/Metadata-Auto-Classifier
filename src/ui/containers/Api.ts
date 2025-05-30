import { DEFAULT_TASK_TEMPLATE } from 'api/prompt';
import type { Model, ProviderConfig } from 'api/types';
import { App, TextAreaComponent } from 'obsidian';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { ModelModal, type ModelModalProps } from 'ui/modals/ModelModal';
import { ProviderModal } from 'ui/modals/ProviderModal';
import { ClassificationCallbacks, ModelCallbacks, ProviderCallbacks } from 'ui/types';

export class Api {
	constructor(
		private readonly app: App,
		private readonly classificationCallbacks: ClassificationCallbacks,
		private readonly providerCallbacks: ProviderCallbacks,
		private readonly modelCallbacks: ModelCallbacks,
		private readonly onRefresh?: () => void
	) {}

	display(
		containerEl: HTMLElement,
		classificationRule: string,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		containerEl.empty();

		// Add API section header
		containerEl.createEl('h2', { text: 'API Configuration' });
		this.addCustomPromptSetting(containerEl, classificationRule);

		// Provider section
		this.addProviderSection(containerEl, providers);

		// Model section
		this.addModelSection(containerEl, providers, selectedModel);
	}

	private addProviderSection(containerEl: HTMLElement, providers: ProviderConfig[]): void {
		const providerSection = containerEl.createEl('div', { cls: 'provider-section' });

		// Section header
		providerSection.createEl('h3', { text: 'Providers' });

		// Provider list
		this.renderProviderList(providerSection, providers);

		// Add provider button
		CommonSetting.create(providerSection, {
			name: '',
			button: {
				text: '+ Add provider',
				onClick: () => {
					this.openProviderModal('add');
				},
			},
		});
	}

	private addCustomPromptSetting(containerEl: HTMLElement, classificationRule: string): void {
		// Create a container for the textarea
		const textAreaContainer = containerEl.createDiv({ cls: 'custom-prompt-container' });
		textAreaContainer.style.width = '100%';
		textAreaContainer.style.marginTop = '8px';
		textAreaContainer.style.marginBottom = '16px';

		// Create the TextAreaComponent first
		const textAreaComponent = new TextAreaComponent(textAreaContainer)
			.setPlaceholder(DEFAULT_TASK_TEMPLATE)
			.setValue(classificationRule)
			.onChange(async (value) => {
				await this.classificationCallbacks.onChange(value);
			});

		// Set the text area dimensions
		textAreaComponent.inputEl.rows = 10;
		textAreaComponent.inputEl.style.width = '100%';

		// Create the setting with reset button using CommonSetting
		CommonSetting.create(containerEl, {
			name: 'Classification Rules',
			desc: 'Customize the prompt template for classification requests',
			extraButton: {
				icon: 'reset',
				tooltip: 'Reset to default template',
				onClick: async () => {
					textAreaComponent.setValue(DEFAULT_TASK_TEMPLATE);
					await this.classificationCallbacks.onChange(DEFAULT_TASK_TEMPLATE);
				},
			},
		});

		containerEl.appendChild(textAreaContainer);
	}

	private addModelSection(
		containerEl: HTMLElement,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		const modelSection = containerEl.createEl('div', { cls: 'model-section' });

		// Section header
		modelSection.createEl('h3', { text: 'Models' });

		// Model list
		this.renderModelList(modelSection, providers, selectedModel);

		// Add model button
		CommonSetting.create(modelSection, {
			name: '',
			button: {
				text: '+ Add model',
				onClick: () => {
					this.openModelModal('add', providers);
				},
			},
		});
	}

	private renderProviderList(containerEl: HTMLElement, providers: ProviderConfig[]): void {
		providers.forEach((provider) => {
			const buttons = [
				{
					icon: 'pencil',
					tooltip: 'Edit',
					onClick: () => {
						this.openProviderModal('edit', provider);
					},
				},
				{
					icon: 'trash',
					tooltip: 'Delete',
					onClick: async () => {
						await this.providerCallbacks.onDelete(provider.name);
						this.onRefresh?.();
					},
				},
			];

			CommonSetting.create(containerEl, {
				name: provider.name,
				buttons: buttons,
			});
		});
	}

	private renderModelList(
		containerEl: HTMLElement,
		providers: ProviderConfig[],
		selectedModel: string
	): void {
		providers.forEach((provider) => {
			provider.models.forEach((config: Model) => {
				const isActive = selectedModel === config.name;
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
								await this.modelCallbacks.onSelect(provider.name, config.name);
								this.onRefresh?.();
							}
						},
					},
					buttons: [
						{
							icon: 'pencil',
							tooltip: 'Edit',
							onClick: () => {
								this.openModelModal('edit', providers, editTarget);
							},
						},
						{
							icon: 'trash',
							tooltip: 'Delete',
							onClick: async () => {
								await this.modelCallbacks.onDelete(config.name);
								this.onRefresh?.();
							},
						},
					],
				});
			});
		});
	}

	// 🎯 Modal UI 로직을 여기로 이동
	private openProviderModal(type: 'add' | 'edit', provider?: ProviderConfig): void {
		const modal = new ProviderModal(
			this.app,
			async (savedProvider: ProviderConfig) => {
				if (type === 'add') {
					await this.providerCallbacks.onAdd(savedProvider);
				} else if (type === 'edit' && provider) {
					await this.providerCallbacks.onUpdate(provider.name, savedProvider);
				}
				this.onRefresh?.();
			},
			provider
		);
		modal.open();
	}

	private openModelModal(
		type: 'add' | 'edit',
		providers: ProviderConfig[],
		editTarget?: { model: string; displayName: string; provider: string }
	): void {
		const modalProps: ModelModalProps = {
			providers: providers,
			onSave: async (result) => {
				if (result.isEdit && result.oldModel) {
					// Edit mode: remove old model from its original provider
					await this.modelCallbacks.onDelete(result.oldModel.model);

					// Update selected model if it was the one being edited
					if (editTarget && editTarget.model === result.oldModel.model) {
						await this.modelCallbacks.onSelect(result.provider, result.model.name);
					}
				}

				// Add model to selected provider
				// Note: This logic should be handled by the parent component
				// For now, we'll call the callback to notify the parent
				this.onRefresh?.();
			},
			editTarget: editTarget,
		};

		const modal = new ModelModal(this.app, modalProps);
		modal.open();
	}
}
