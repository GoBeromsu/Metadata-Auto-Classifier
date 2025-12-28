import type { LinkType } from 'frontmatter/types';
import type { App, TextAreaComponent } from 'obsidian';
import { Modal, Setting, TextAreaComponent as ObsidianTextArea } from 'obsidian';
import { WikiLinkSelector } from 'ui/components/WikiLinkSelector';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import type { FrontmatterEditorModalProps } from 'ui/types';

export class ConfigurableSettingModal extends Modal {
	private readonly props: FrontmatterEditorModalProps;
	private textAreaComponent: TextAreaComponent;

	constructor(app: App, props: FrontmatterEditorModalProps) {
		super(app);
		this.props = props;
	}

	onOpen(): void {
		const { contentEl } = this;

		this.setTitle(`Edit Setting: ${this.props.frontmatterSetting.name}`);

		// Name setting (always shown)
		CommonSetting.create(contentEl, {
			name: 'Name',
			className: 'setting-name',
			textInput: {
				placeholder: 'Enter name',
				value: this.props.frontmatterSetting.name,
				onChange: async (value) => {
					this.props.frontmatterSetting.name = value;
				},
			},
		});

		// Controls container
		const controlsContainer = contentEl.createDiv({ cls: 'controls-container' });

		// Only show LinkType if enabled
		if (this.props.options.showLinkType) {
			this.addLinkTypeSetting(controlsContainer);
		}

		// Overwrite Toggle (always shown)
		this.addOverwriteSetting(controlsContainer);

		// Count (always shown)
		this.addCountSetting(controlsContainer);

		// Options section (conditional)
		if (this.props.options.showOptions) {
			this.addOptionsSection(controlsContainer);
		}

		// Custom Query section (always shown)
		this.addCustomQuerySection(controlsContainer);

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
				value: this.props.frontmatterSetting.linkType || 'Normal',
				onChange: async (value) => {
					this.props.frontmatterSetting.linkType = value as LinkType;
				},
			},
		});
	}

	private addOverwriteSetting(containerEl: HTMLElement): void {
		CommonSetting.create(containerEl, {
			name: 'Overwrite',
			className: 'control-setting',
			toggle: {
				value: this.props.frontmatterSetting.overwrite,
				onChange: async (value) => {
					this.props.frontmatterSetting.overwrite = value;
				},
			},
		});
	}

	private addCountSetting(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Maximum Count').addSlider((slider) => {
			slider
				.setLimits(1, 10, 1)
				.setValue(this.props.frontmatterSetting.count.max)
				.setDynamicTooltip()
				.onChange((value) => {
					this.props.frontmatterSetting.count.min = 1;
					this.props.frontmatterSetting.count.max = value;
				});
		});
	}

	private addOptionsSection(containerEl: HTMLElement): void {
		if (!this.props.options.showOptions) return;

		// Container for vertical layout: label on top, textarea below
		const sectionContainer = containerEl.createDiv({ cls: 'setting-item' });

		new Setting(sectionContainer)
			.setName('Available Options')
			.setDesc('Values that the AI can use as suggestions')
			.addButton((button) => {
				button
					.setButtonText('Browse Files')
					.setIcon('folder')
					.onClick(() => {
						const wikiLinkSelector = new WikiLinkSelector(this.app);
						wikiLinkSelector.openFileSelector((selectedLink) => {
							const formattedLink =
								this.props.frontmatterSetting.linkType === 'WikiLink'
									? `[[${selectedLink}]]`
									: selectedLink;
							const currentOptions = this.props.frontmatterSetting.refs || [];
							this.props.frontmatterSetting.refs = [...currentOptions, formattedLink];
							this.updateOptionsTextarea();
						});
					});
			});

		if (this.props.options.showTextArea) {
			let displayValue = '';
			if (this.props.frontmatterSetting.refs && this.props.frontmatterSetting.refs.length > 0) {
				displayValue = this.props.frontmatterSetting.refs.join(', ');
			}

			this.textAreaComponent = new ObsidianTextArea(sectionContainer);
			this.textAreaComponent
				.setPlaceholder('Option1, Option2, Option3...')
				.setValue(displayValue)
				.onChange(async (value) => {
					const inputOptions = value
						.split(',')
						.map((option) => option.trim())
						.filter(Boolean);
					this.props.frontmatterSetting.refs = inputOptions;
				});
			this.textAreaComponent.inputEl.rows = 4;
		}
	}

	private updateOptionsTextarea(): void {
		if (this.textAreaComponent) {
			let displayValue = '';
			if (this.props.frontmatterSetting.refs && this.props.frontmatterSetting.refs.length > 0) {
				displayValue = this.props.frontmatterSetting.refs.join(', ');
			}
			this.textAreaComponent.setValue(displayValue);
		}
	}

	private addCustomQuerySection(containerEl: HTMLElement): void {
		// Container for vertical layout: label on top, textarea below
		const sectionContainer = containerEl.createDiv({ cls: 'setting-item' });

		new Setting(sectionContainer)
			.setName('Custom Classification Rules')
			.setDesc('Add custom instructions to provide more context for classification.');

		const textArea = new ObsidianTextArea(sectionContainer);
		textArea
			.setPlaceholder('Enter specific classification rules or additional context here...')
			.setValue(this.props.frontmatterSetting.customQuery || '')
			.onChange(async (value) => {
				this.props.frontmatterSetting.customQuery = value;
			});
		textArea.inputEl.rows = 4;
	}

	private addActionButtons(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.addButton((btn) =>
				btn.setButtonText('Cancel').onClick(() => {
					this.close();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText('Save')
					.setCta()
					.onClick(async () => {
						await this.props.onSave(this.props.frontmatterSetting);
						this.close();
					})
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
