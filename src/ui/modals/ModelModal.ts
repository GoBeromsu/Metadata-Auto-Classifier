import type { Model, ProviderConfig, ProviderPreset } from 'api/types';
import type { App } from 'obsidian';
import { Modal } from 'obsidian';
import { CommonButton } from 'ui/components/common/CommonButton';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import type { DropdownOption } from 'ui/components/common/CommonSetting';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { getProviderPresets } from 'utils';

export interface ModelModalProps {
	providers: ProviderConfig[];
	onSave: (result: {
		provider: string;
		model: Model;
		isEdit: boolean;
		oldModel?: { model: string; provider: string };
	}) => void;
	editTarget?: { model: string; displayName: string; provider: string };
}

export class ModelModal extends Modal {
	private props: ModelModalProps;

	// Form state
	private selectedProvider: string = '';
	private displayName: string = '';
	private modelId: string = '';

	constructor(app: App, props: ModelModalProps) {
		super(app);
		this.props = props;

		// Set initial values
		if (props.editTarget) {
			this.selectedProvider = props.editTarget.provider;
			this.displayName = props.editTarget.displayName;
			this.modelId = props.editTarget.model;
		} else {
			// Set default provider for new models
			if (props.providers.length > 0) {
				this.selectedProvider = props.providers[0].name;
			}
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Modal title
		const title = this.props.editTarget ? 'Edit Model' : 'Add Model';
		contentEl.createEl('h2', { text: title });

		// Provider selection
		this.addProviderSetting(contentEl);

		// Popular models section (only show for new models)
		if (!this.props.editTarget) {
			this.addPopularModelsSection(contentEl);
		}

		// Model form
		this.addModelForm(contentEl);

		// Buttons
		this.addButtons(contentEl);
	}

	private addProviderSetting(containerEl: HTMLElement): void {
		const providerOptions: DropdownOption[] = this.props.providers.map((provider) => ({
			value: provider.name,
			display: provider.name,
		}));

		CommonSetting.create(containerEl, {
			name: 'Provider',
			desc: 'Select the provider for this model.',
			dropdown: {
				options: providerOptions,
				value: this.selectedProvider,
				onChange: (value) => {
					this.selectedProvider = value;
					this.updatePopularModels();
				},
			},
		});
	}

	private addPopularModelsSection(containerEl: HTMLElement): void {
		const popularSection = containerEl.createEl('div', { cls: 'popular-models-section' });
		popularSection.createEl('h3', { text: 'Popular models' });
		popularSection.createEl('p', {
			text: 'Choose from commonly used models or enter custom model details.',
			cls: 'setting-item-description',
		});

		this.renderPopularModels(popularSection);
	}

	private renderPopularModels(containerEl: HTMLElement): void {
		// Remove existing models container
		const existingContainer = containerEl.querySelector('.popular-models-container');
		if (existingContainer) {
			existingContainer.remove();
		}

		// Find the selected provider data using utils
		let providerData: ProviderPreset | null = null;
		if (this.selectedProvider) {
			const presets = getProviderPresets();
			providerData = presets.find((preset) => preset.name === this.selectedProvider) || null;
		}

		const modelsContainer = containerEl.createEl('div', {
			cls: 'popular-models-container',
		});
		modelsContainer.style.display = 'grid';
		modelsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
		modelsContainer.style.gap = '8px';
		modelsContainer.style.marginTop = '10px';
		modelsContainer.style.marginBottom = '20px';

		if (providerData && providerData.popularModels) {
			// Add popular models as radio buttons
			providerData.popularModels.forEach((model) => {
				const modelOption = modelsContainer.createEl('label', {
					cls: 'model-option',
				});
				modelOption.style.display = 'flex';
				modelOption.style.alignItems = 'center';
				modelOption.style.padding = '8px 12px';
				modelOption.style.border = '1px solid var(--background-modifier-border)';
				modelOption.style.borderRadius = '4px';
				modelOption.style.cursor = 'pointer';

				const radio = modelOption.createEl('input', {
					type: 'radio',
					attr: { name: 'popular-model' },
				});
				radio.value = model.id;
				radio.style.marginRight = '8px';
				radio.addEventListener('change', () => {
					if (radio.checked) {
						this.displayName = model.name;
						this.modelId = model.id;
						this.updateFormInputs();
						this.updateRadioSelection();
					}
				});

				modelOption.createEl('span', { text: model.name });
			});
		}

		// Add Custom option
		const customOption = modelsContainer.createEl('label', {
			cls: 'model-option custom-option',
		});
		customOption.style.display = 'flex';
		customOption.style.alignItems = 'center';
		customOption.style.padding = '8px 12px';
		customOption.style.border = '1px solid var(--background-modifier-border)';
		customOption.style.borderRadius = '4px';
		customOption.style.cursor = 'pointer';

		const customRadio = customOption.createEl('input', {
			type: 'radio',
			attr: { name: 'popular-model' },
		});
		customRadio.value = 'custom';
		customRadio.style.marginRight = '8px';
		customRadio.checked = true; // Set Custom as default selection
		customRadio.addEventListener('change', () => {
			if (customRadio.checked) {
				this.displayName = '';
				this.modelId = '';
				this.updateFormInputs();
				this.updateRadioSelection();
			}
		});
		customOption.createEl('span', { text: 'Custom model' });
	}

	private updateRadioSelection(): void {
		const modelOptions = this.contentEl.querySelectorAll('.model-option');
		modelOptions.forEach((option) => {
			const radio = option.querySelector('input[type="radio"]') as HTMLInputElement;
			const label = option as HTMLElement;

			if (radio && radio.checked) {
				label.style.backgroundColor = 'var(--interactive-accent)';
				label.style.color = 'var(--text-on-accent)';
				label.style.borderColor = 'var(--interactive-accent)';
			} else {
				label.style.backgroundColor = '';
				label.style.color = '';
				label.style.borderColor = 'var(--background-modifier-border)';
			}
		});
	}

	private addModelForm(containerEl: HTMLElement): void {
		// Create form container with class for easy identification
		const formContainer = containerEl.createDiv({ cls: 'model-form-container' });

		// Display name
		CommonSetting.create(formContainer, {
			name: 'Display name',
			desc: 'The name of the model you want to display in the interface.',
			textInput: {
				placeholder: 'Enter display name',
				value: this.displayName,
				onChange: (value) => {
					this.displayName = value;
				},
			},
		});

		// Model ID
		CommonSetting.create(formContainer, {
			name: 'Model ID',
			desc: 'The identifier of the model from your provider. Typically a short name without spaces.',
			textInput: {
				placeholder: 'Enter model ID',
				value: this.modelId,
				onChange: (value) => {
					this.modelId = value;
				},
			},
		});
	}

	private updateFormInputs(): void {
		// Find and update input fields instead of re-rendering entire modal
		const formContainer = this.contentEl.querySelector('.model-form-container');
		if (!formContainer) return;

		// Update display name input
		const displayNameInput = formContainer.querySelector(
			'input[placeholder="Enter display name"]'
		) as HTMLInputElement;
		if (displayNameInput) {
			displayNameInput.value = this.displayName;
		}

		// Update model ID input
		const modelIdInput = formContainer.querySelector(
			'input[placeholder="Enter model ID"]'
		) as HTMLInputElement;
		if (modelIdInput) {
			modelIdInput.value = this.modelId;
		}
	}

	private addButtons(containerEl: HTMLElement): void {
		const buttonContainer = containerEl.createDiv({ cls: 'button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '8px';
		buttonContainer.style.marginTop = '20px';

		CommonButton(buttonContainer, {
			text: 'Cancel',
			onClick: () => this.close(),
		});

		CommonButton(buttonContainer, {
			text: 'Save',
			cta: true,
			onClick: async () => {
				if (this.validateForm()) {
					const model: Model = {
						name: this.modelId,
						displayName: this.displayName,
					};

					// Use callback to handle business logic
					this.props.onSave({
						provider: this.selectedProvider,
						model: model,
						isEdit: !!this.props.editTarget,
						oldModel: this.props.editTarget
							? {
									model: this.props.editTarget.model,
									provider: this.props.editTarget.provider,
								}
							: undefined,
					});
					this.close();
				}
			},
		});
	}

	private updatePopularModels(): void {
		const popularSection = this.contentEl.querySelector('.popular-models-section');
		if (popularSection) {
			this.renderPopularModels(popularSection as HTMLElement);
		}
	}

	private validateForm(): boolean {
		if (!this.selectedProvider) {
			CommonNotice.showError(new Error('Provider is required'));
			return false;
		}

		if (!this.modelId.trim()) {
			CommonNotice.showError(new Error('Model ID is required'));
			return false;
		}

		if (!this.displayName.trim()) {
			CommonNotice.showError(new Error('Display name is required'));
			return false;
		}

		return true;
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
