import AutoClassifierPlugin from 'main';
import { App, Modal, TextAreaComponent } from 'obsidian';
import { SettingsComponentOptions } from 'ui/components/BaseSettings';
import { WikiLinkSelector } from 'ui/components/WikiLinkSelector';
import { CommonButton } from 'ui/components/common/CommonButton';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import { FrontmatterTemplate } from 'utils/interface';

export class ConfigurableSettingModal extends Modal {
	readonly frontmatterSetting: FrontmatterTemplate;
	readonly plugin: AutoClassifierPlugin;
	readonly options: SettingsComponentOptions;

	private textAreaComponent: TextAreaComponent;

	constructor(
		app: App,
		plugin: AutoClassifierPlugin,
		frontmatterSetting: FrontmatterTemplate,
		options: SettingsComponentOptions
	) {
		super(app);
		this.plugin = plugin;
		this.frontmatterSetting = frontmatterSetting;
		this.options = options;
	}

	onOpen() {
		const { contentEl } = this;

		this.setTitle(`Edit Setting: ${this.frontmatterSetting.name}`);

		// Name setting (always shown)
		CommonSetting.create(contentEl, {
			name: 'Name',
			className: 'setting-name',
			textInput: {
				placeholder: 'Enter name',
				value: this.frontmatterSetting.name,
				onChange: async (value) => {
					this.frontmatterSetting.name = value;
				},
			},
		});

		// Controls container
		const controlsContainer = contentEl.createDiv({ cls: 'controls-container' });

		// Only show LinkType if enabled
		if (this.options.showLinkType) {
			this.addLinkTypeSetting(controlsContainer);
		}

		// Overwrite Toggle (always shown)
		this.addOverwriteSetting(controlsContainer);

		// Count (always shown)
		this.addCountSetting(controlsContainer);

		// Options section (conditional)
		if (this.options.showOptions) {
			this.addOptionsSection(contentEl);
		}

		// Custom Query section (always shown)
		this.addCustomQuerySection(contentEl);

		// Add save/cancel buttons
		this.addActionButtons(contentEl);
	}

	private addLinkTypeSetting(containerEl: HTMLElement): void {
		CommonSetting.create(containerEl, {
			name: 'Link Type',
			className: 'control-setting',
			dropdown: {
				options: [
					{ value: 'WikiLink', display: 'WikiLink' },
					{ value: 'Normal', display: 'Normal' },
				],
				value: this.frontmatterSetting.linkType || 'Normal',
				onChange: async (value) => {
					this.frontmatterSetting.linkType = value as 'WikiLink' | 'Normal';
				},
			},
		});
	}

	private addOverwriteSetting(containerEl: HTMLElement): void {
		CommonSetting.create(containerEl, {
			name: 'Overwrite',
			className: 'control-setting',
			toggle: {
				value: this.frontmatterSetting.overwrite,
				onChange: async (value) => {
					this.frontmatterSetting.overwrite = value;
				},
			},
		});
	}

	private addCountSetting(containerEl: HTMLElement): void {
		CommonSetting.create(containerEl, {
			name: 'Count',
			className: 'control-setting',
			textInput: {
				placeholder: 'Enter count',
				value: this.frontmatterSetting.count.toString(),
				onChange: async (value) => {
					const count = parseInt(value, 10);
					if (!isNaN(count) && count > 0) {
						this.frontmatterSetting.count = count;
					}
				},
			},
		});
	}

	private addOptionsSection(containerEl: HTMLElement): void {
		// Only add options section if showOptions is enabled
		if (!this.options.showOptions) return;

		// Options section header with Browse Files button
		CommonSetting.create(containerEl, {
			name: 'Available Options',
			desc: 'Enter values that the AI can use as suggestions, separated by commas.',
			className: 'options-header',
			heading: true,
			button: {
				icon: 'folder',
				text: 'Browse Files',
				onClick: () => {
					const wikiLinkSelector = new WikiLinkSelector(this.plugin.app);
					wikiLinkSelector.openFileSelector((selectedLink) => {
						// Format the link based on current linkType
						const formattedLink =
							this.frontmatterSetting.linkType === 'WikiLink'
								? `[[${selectedLink}]]`
								: selectedLink;
						const currentOptions = this.frontmatterSetting.refs || [];

						this.frontmatterSetting.refs = [...currentOptions, formattedLink];
						this.updateOptionsTextarea();
					});
				},
			},
		});

		// Only add text area if showTextArea is enabled
		if (this.options.showTextArea) {
			const textareaContainer = containerEl.createDiv({ cls: 'textarea-container' });
			textareaContainer.style.width = '100%';
			textareaContainer.style.marginTop = '8px';
			textareaContainer.style.minHeight = '100px';

			let displayValue = '';
			if (this.frontmatterSetting.refs && this.frontmatterSetting.refs.length > 0) {
				displayValue = this.frontmatterSetting.refs.join(', ');
			}

			this.textAreaComponent = new TextAreaComponent(textareaContainer)
				.setPlaceholder('Option1, Option2, Option3...')
				.setValue(displayValue)
				.onChange(async (value) => {
					const inputOptions = value
						.split(',')
						.map((option) => option.trim())
						.filter(Boolean);

					this.frontmatterSetting.refs = inputOptions;
				});
			// Adjust text area height and width
			this.textAreaComponent.inputEl.style.width = '100%';
			this.textAreaComponent.inputEl.style.height = '100px';
		}
	}

	private updateOptionsTextarea(): void {
		if (this.textAreaComponent) {
			let displayValue = '';
			if (this.frontmatterSetting.refs && this.frontmatterSetting.refs.length > 0) {
				displayValue = this.frontmatterSetting.refs.join(', ');
			}
			this.textAreaComponent.setValue(displayValue);
		}
	}

	private addCustomQuerySection(containerEl: HTMLElement): void {
		// Custom Query section header
		CommonSetting.create(containerEl, {
			name: 'Custom Classification Rules',
			desc: 'Add custom instructions to provide more context for classification.',
			className: 'custom-query-header',
			heading: true,
		});

		// Create a container for the textarea
		const textareaContainer = containerEl.createDiv({ cls: 'textarea-container' });
		textareaContainer.style.width = '100%';
		textareaContainer.style.marginTop = '8px';
		textareaContainer.style.minHeight = '100px';

		// Create the TextAreaComponent
		const customQueryTextArea = new TextAreaComponent(textareaContainer)
			.setPlaceholder('Enter specific classification rules or additional context here...')
			.setValue(this.frontmatterSetting.customQuery || '')
			.onChange(async (value) => {
				this.frontmatterSetting.customQuery = value;
			});

		// Adjust text area height and width
		customQueryTextArea.inputEl.style.width = '100%';
		customQueryTextArea.inputEl.style.height = '100px';
	}

	private addActionButtons(containerEl: HTMLElement): void {
		const buttonContainer = containerEl.createDiv({ cls: 'modal-buttons' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '8px';
		buttonContainer.style.marginTop = '20px';

		new CommonButton(buttonContainer, {
			text: 'Cancel',
			onClick: () => {
				this.close();
			},
		});

		new CommonButton(buttonContainer, {
			text: 'Save',
			cta: true,
			onClick: async () => {
				await this.plugin.saveSettings();
				this.close();
			},
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
