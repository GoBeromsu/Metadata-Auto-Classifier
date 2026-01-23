import { deepCloneFrontmatterField } from 'frontmatter';
import type { FrontmatterField, LinkType } from 'frontmatter/types';
import type { App, TextAreaComponent } from 'obsidian';
import { Modal, Setting, TextAreaComponent as ObsidianTextArea } from 'obsidian';
import { WikiLinkSelector } from 'ui/components/WikiLinkSelector';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { CommonSetting } from 'ui/components/common/CommonSetting';
import type { FrontmatterEditorModalProps } from 'ui/types';

export class ConfigurableSettingModal extends Modal {
	private readonly props: FrontmatterEditorModalProps;
	private readonly localState: FrontmatterField;
	private textAreaComponent: TextAreaComponent;

	constructor(app: App, props: FrontmatterEditorModalProps) {
		super(app);
		this.props = props;
		this.localState = deepCloneFrontmatterField(props.frontmatterSetting);
	}

	onOpen(): void {
		const { contentEl } = this;

		this.setTitle(`Edit Setting: ${this.localState.name}`);

		// Name setting (always shown)
		CommonSetting.create(contentEl, {
			name: 'Name',
			className: 'setting-name',
			textInput: {
				placeholder: 'Enter name',
				value: this.localState.name,
				onChange: async (value) => {
					this.localState.name = value;
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
				value: this.localState.linkType || 'Normal',
				onChange: async (value) => {
					this.localState.linkType = value as LinkType;
				},
			},
		});
	}

	private addOverwriteSetting(containerEl: HTMLElement): void {
		CommonSetting.create(containerEl, {
			name: 'Overwrite',
			className: 'control-setting',
			toggle: {
				value: this.localState.overwrite,
				onChange: async (value) => {
					this.localState.overwrite = value;
				},
			},
		});
	}

	private addCountSetting(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Maximum Count').addSlider((slider) => {
			slider
				.setLimits(1, 10, 1)
				.setValue(this.localState.count.max)
				.setDynamicTooltip()
				.onChange((value) => {
					this.localState.count.min = 1;
					this.localState.count.max = value;
				});
		});
	}

	private addOptionsSection(containerEl: HTMLElement): void {
		if (!this.props.options.showOptions) return;

		new Setting(containerEl)
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
								this.localState.linkType === 'WikiLink'
									? `[[${selectedLink}]]`
									: selectedLink;
							const currentOptions = this.localState.refs || [];
							this.localState.refs = [...currentOptions, formattedLink];
							this.updateOptionsTextarea();
						});
					});
			});

		if (this.props.options.showTextArea) {
			let displayValue = '';
			if (this.localState.refs && this.localState.refs.length > 0) {
				displayValue = this.localState.refs.join(', ');
			}

			this.textAreaComponent = new ObsidianTextArea(containerEl);
			this.textAreaComponent
				.setPlaceholder('Option1, Option2, Option3...')
				.setValue(displayValue)
				.onChange(async (value) => {
					const inputOptions = value
						.split(',')
						.map((option) => option.trim())
						.filter(Boolean);
					this.localState.refs = inputOptions;
				});
			this.textAreaComponent.inputEl.rows = 4;
			this.textAreaComponent.inputEl.setCssStyles({ width: '100%' });
		}
	}

	private updateOptionsTextarea(): void {
		if (this.textAreaComponent) {
			let displayValue = '';
			if (this.localState.refs && this.localState.refs.length > 0) {
				displayValue = this.localState.refs.join(', ');
			}
			this.textAreaComponent.setValue(displayValue);
		}
	}

	private addCustomQuerySection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Custom Classification Rules')
			.setDesc('Add custom instructions to provide more context for classification.');

		const textArea = new ObsidianTextArea(containerEl);
		textArea
			.setPlaceholder('Enter specific classification rules or additional context here...')
			.setValue(this.localState.customQuery || '')
			.onChange(async (value) => {
				this.localState.customQuery = value;
			});
		textArea.inputEl.rows = 4;
		textArea.inputEl.setCssStyles({ width: '100%' });
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
						const notice = CommonNotice.startProgress('Saving settings...');
						btn.setDisabled(true);
						try {
							await this.props.onSave(this.localState);
							this.close();
						} finally {
							CommonNotice.endProgress(notice);
						}
					})
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
