import { DEFAULT_TASK_TEMPLATE } from 'api/prompt';
import type { Model } from 'api/types';
import { Setting, TextAreaComponent } from 'obsidian';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { ApiProps, UIComponent } from 'ui/types';

export class ApiComponent implements UIComponent {
	private containerEl: HTMLElement | null = null;
	private props: ApiProps;

	constructor(props: ApiProps) {
		this.props = props;
	}

	updateProps(newProps: ApiProps): void {
		this.props = newProps;
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
					this.props.onOpenProviderModal('add');
				},
			},
		});
	}

	private addCustomPromptSetting(containerEl: HTMLElement): void {
		const currentTemplate = this.props.classificationRule;

		// Create a container for the textarea
		const textAreaContainer = containerEl.createDiv({ cls: 'custom-prompt-container' });
		textAreaContainer.style.width = '100%';
		textAreaContainer.style.marginTop = '8px';
		textAreaContainer.style.marginBottom = '16px';

		// Create the TextAreaComponent first
		const textAreaComponent = new TextAreaComponent(textAreaContainer)
			.setPlaceholder(DEFAULT_TASK_TEMPLATE)
			.setValue(currentTemplate)
			.onChange(async (value) => {
				await this.props.onClassificationRuleChange(value);
			});

		// Set the text area dimensions
		textAreaComponent.inputEl.rows = 10;
		textAreaComponent.inputEl.style.width = '100%';

		// Create the setting with reset button after textAreaComponent is declared
		new Setting(containerEl)
			.setName('Classification Rules')
			.setDesc('Customize the prompt template for classification requests')
			.addExtraButton((button) =>
				button
					.setIcon('reset')
					.setTooltip('Reset to default template')
					.onClick(async () => {
						textAreaComponent.setValue(DEFAULT_TASK_TEMPLATE);
						await this.props.onClassificationRuleChange(DEFAULT_TASK_TEMPLATE);
					})
			);

		containerEl.appendChild(textAreaContainer);
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
				onClick: () => {
					this.props.onOpenModelModal('add', undefined);
				},
			},
		});
	}

	private renderProviderList(containerEl: HTMLElement): void {
		this.props.providers.forEach((provider) => {
			const buttons = [
				{
					icon: 'pencil',
					tooltip: 'Edit',
					onClick: () => {
						this.props.onOpenProviderModal('edit', provider);
					},
				},
				{
					icon: 'trash',
					tooltip: 'Delete',
					onClick: async () => {
						await this.props.onProviderDelete(provider.name);
						this.props.onRefresh?.();
					},
				},
			];

			CommonSetting.create(containerEl, {
				name: provider.name,
				buttons: buttons,
			});
		});
	}

	private renderModelList(containerEl: HTMLElement): void {
		this.props.providers.forEach((provider) => {
			provider.models.forEach((config: Model) => {
				const isActive = this.props.selectedModel === config.name;
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
								await this.props.onModelSelect(provider.name, config.name);
								this.refreshModelSection();
							}
						},
					},
					buttons: [
						{
							icon: 'pencil',
							tooltip: 'Edit',
							onClick: () => {
								this.props.onOpenModelModal('edit', editTarget);
							},
						},
						{
							icon: 'trash',
							tooltip: 'Delete',
							onClick: async () => {
								await this.props.onModelDelete(config.name);
								this.refreshModelSection();
							},
						},
					],
				});
			});
		});
	}

	private refreshModelSection(): void {
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
					onClick: () => {
						this.props.onOpenModelModal('add');
					},
				},
			});
		}
	}
}
