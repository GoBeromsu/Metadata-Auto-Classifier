import AutoClassifierPlugin from 'main';
import { Modal, Notice } from 'obsidian';
import { CommonButton } from 'ui/components/common/CommonButton';
import { CommonSetting, DropdownOption } from 'ui/components/common/CommonSetting';
import { Model } from 'utils/interface';

const providersData = require('../../data/providers.json');

interface ProviderPreset {
	id: string;
	name: string;
	apiKeyUrl: string;
	apiKeyRequired: boolean;
	modelsList: string;
	baseUrl: string;
	popularModels: Array<{ id: string; name: string }>;
}

export class ModelModal extends Modal {
	private plugin: AutoClassifierPlugin;
	private onSave: () => void;
	private existingModel?: { model: string; displayName: string; provider: string };

	// Form state
	private selectedProvider: string = '';
	private displayName: string = '';
	private modelId: string = '';

	constructor(
		plugin: AutoClassifierPlugin,
		onSave: () => void,
		existingModel?: { model: string; displayName: string; provider: string }
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSave = onSave;
		this.existingModel = existingModel;

		// Set initial values
		if (existingModel) {
			this.selectedProvider = existingModel.provider;
			this.displayName = existingModel.displayName;
			this.modelId = existingModel.model;
		} else {
			// Set default provider for new models
			if (this.plugin.settings.providers.length > 0) {
				this.selectedProvider = this.plugin.settings.providers[0].name;
			}
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Modal title
		const title = this.existingModel ? 'Edit Model' : 'Add Model';
		contentEl.createEl('h2', { text: title });

		// Provider selection
		this.addProviderSetting(contentEl);

		// Popular models section (only show for new models)
		if (!this.existingModel) {
			this.addPopularModelsSection(contentEl);
		}

		// Model form
		this.addModelForm(contentEl);

		// Buttons
		this.addButtons(contentEl);
	}

	private addProviderSetting(containerEl: HTMLElement): void {
		const providerOptions: DropdownOption[] = this.plugin.settings.providers.map((provider) => ({
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

		// Find the selected provider data
		let providerData: ProviderPreset | null = null;
		if (this.selectedProvider) {
			providerData = Object.values(providersData).find(
				(p: any) => p.name === this.selectedProvider
			) as ProviderPreset;
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

		new CommonButton(buttonContainer, {
			text: 'Cancel',
			onClick: () => this.close(),
		});

		new CommonButton(buttonContainer, {
			text: 'Save',
			cta: true,
			onClick: async () => {
				if (this.validateForm()) {
					const model: Model = {
						name: this.modelId,
						displayName: this.displayName,
					};

					// Find the provider and add/update the model
					const newProvider = this.plugin.settings.providers.find(
						(p) => p.name === this.selectedProvider
					);
					if (newProvider) {
						if (this.existingModel) {
							// Edit mode: remove old model from its original provider and add updated one to selected provider
							const originalProvider = this.plugin.settings.providers.find(
								(p) => p.name === this.existingModel!.provider
							);
							if (originalProvider) {
								originalProvider.models = originalProvider.models.filter(
									(m) => m.name !== this.existingModel!.model
								);
							}
							newProvider.models.push(model);

							// Update selected model if it was the one being edited
							if (this.plugin.settings.selectedModel === this.existingModel.model) {
								this.plugin.settings.selectedModel = model.name;
							}
						} else {
							// Add mode: just add the new model
							newProvider.models.push(model);
						}
					}

					await this.plugin.saveSettings();
					this.onSave();
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
			new Notice('Provider is required');
			return false;
		}

		if (!this.modelId.trim()) {
			new Notice('Model ID is required');
			return false;
		}

		if (!this.displayName.trim()) {
			new Notice('Display name is required');
			return false;
		}

		return true;
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
