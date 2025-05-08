import { getFrontmatterSetting } from 'frontmatter';
import { App, Modal, Setting, TextAreaComponent } from 'obsidian';

import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constant';
import { FrontmatterTemplate } from 'utils/interface';
import { BaseSettingsComponent } from './BaseSettingsComponent';
import { WikiLinkSelector } from './WikiLinkSelector';

export class FrontmatterModal extends Modal {
	private frontmatterSetting: FrontmatterTemplate;
	private plugin: any;
	private textAreaComponent: TextAreaComponent;

	constructor(app: App, plugin: any, frontmatterSetting: FrontmatterTemplate) {
		super(app);
		this.plugin = plugin;
		this.frontmatterSetting = frontmatterSetting;
	}

	onOpen() {
		const { contentEl } = this;

		this.setTitle(`Edit Frontmatter: ${this.frontmatterSetting.name}`);

		// Name setting
		new Setting(contentEl)
			.setName('Frontmatter Name')
			.setClass('frontmatter-name-setting')
			.addText((text) => {
				text
					.setPlaceholder('Enter frontmatter name')
					.setValue(this.frontmatterSetting.name)
					.onChange(async (value) => {
						this.frontmatterSetting.name = value;
					});
			});

		// Controls container
		const controlsContainer = contentEl.createDiv({ cls: 'frontmatter-controls-container' });

		// 1. Link Type setting
		new Setting(controlsContainer)
			.setName('Link Type')
			.setClass('control-setting')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('WikiLink', 'WikiLink')
					.addOption('Normal', 'Normal')
					.setValue(this.frontmatterSetting.linkType || DEFAULT_FRONTMATTER_SETTING.linkType)
					.onChange(async (value) => {
						this.frontmatterSetting.linkType = value as 'WikiLink' | 'Normal';
					});
			});

		// 2. Overwrite Toggle
		new Setting(controlsContainer)
			.setName('Overwrite')
			.setClass('control-setting')
			.addToggle((toggle) => {
				toggle.setValue(this.frontmatterSetting.overwrite).onChange(async (value) => {
					this.frontmatterSetting.overwrite = value;
				});
			});

		// 3. Count
		new Setting(controlsContainer)
			.setName('Count')
			.setClass('control-setting')
			.addText((text) => {
				text
					.setPlaceholder('Enter count')
					.setValue(this.frontmatterSetting.count.toString())
					.onChange(async (value) => {
						const count = parseInt(value, 10);
						if (!isNaN(count) && count > 0) {
							this.frontmatterSetting.count = count;
						}
					});
			});

		// Options section
		this.addOptionsSection(contentEl);

		// Save and Close buttons
		const buttonContainer = contentEl.createDiv({ cls: 'frontmatter-modal-buttons' });

		new Setting(buttonContainer)
			.addButton((button) => {
				button
					.setButtonText('Save')
					.setCta()
					.onClick(async () => {
						await this.plugin.saveSettings();
						this.close();
					});
			})
			.addButton((button) => {
				button.setButtonText('Cancel').onClick(() => {
					this.close();
				});
			});
	}

	private addOptionsSection(containerEl: HTMLElement): void {
		// Options section header
		const optionsHeaderSetting = new Setting(containerEl)
			.setName('Available Options')
			.setHeading()
			.setClass('options-header');

		optionsHeaderSetting.setDesc(
			'Enter values that the AI can use as suggestions, separated by commas.'
		);

		optionsHeaderSetting.addButton((button) => {
			button
				.setIcon('folder')
				.setClass('browse-button')
				.setButtonText('Browse Files')
				.onClick(() => {
					const wikiLinkSelector = new WikiLinkSelector(this.app);
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
				});
		});

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

	private updateOptionsTextarea(): void {
		if (this.textAreaComponent) {
			let displayValue = '';
			if (this.frontmatterSetting.refs && this.frontmatterSetting.refs.length > 0) {
				displayValue = this.frontmatterSetting.refs.join(', ');
			}
			this.textAreaComponent.setValue(displayValue);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class Frontmatter extends BaseSettingsComponent {
	display(containerEl: HTMLElement, frontmatterId: number): void {
		containerEl.empty();

		const frontmatterSetting = getFrontmatterSetting(
			frontmatterId,
			this.plugin.settings.frontmatter
		);

		// Simple display with just name and edit button
		new Setting(containerEl)
			.setName(frontmatterSetting.name || 'Please enter name')
			.setDesc(`Type: ${frontmatterSetting.linkType}, Count: ${frontmatterSetting.count}`)
			.addButton((button) => {
				button
					.setIcon('pencil')
					.setTooltip('Edit Frontmatter')
					.onClick(() => {
						const modal = new FrontmatterModal(this.plugin.app, this.plugin, frontmatterSetting);
						modal.open();
					});
			})
			.addButton((button) => {
				button
					.setIcon('trash-2')
					.setClass('delete-frontmatter-btn')
					.setWarning()
					.setTooltip('Delete Frontmatter')
					.onClick(async () => {
						if (
							confirm(`Are you sure you want to delete "${frontmatterSetting.name}" frontmatter?`)
						) {
							this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
								(f: FrontmatterTemplate) => f.id !== frontmatterSetting.id
							);
							await this.plugin.saveSettings();
							containerEl.empty();
						}
					});
			});
	}
}
