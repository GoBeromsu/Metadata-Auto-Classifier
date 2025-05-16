import AutoClassifierPlugin from 'main';
import { Modal, TextAreaComponent, App, Setting } from 'obsidian';
import { FrontmatterTemplate } from 'utils/interface';
import { SettingsComponentOptions } from 'ui/components/BaseSettings';
import { WikiLinkSelector } from 'ui/components/WikiLinkSelector';

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
		new Setting(contentEl)
			.setName('Name')
			.setClass('setting-name')
			.addText((text) => {
				text
					.setPlaceholder('Enter name')
					.setValue(this.frontmatterSetting.name)
					.onChange(async (value) => {
						this.frontmatterSetting.name = value;
					});
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

		// Add save/cancel buttons
		this.addActionButtons(contentEl);
	}

	private addLinkTypeSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Link Type')
			.setClass('control-setting')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('WikiLink', 'WikiLink')
					.addOption('Normal', 'Normal')
					.setValue(this.frontmatterSetting.linkType || 'Normal')
					.onChange(async (value) => {
						this.frontmatterSetting.linkType = value as 'WikiLink' | 'Normal';
					});
			});
	}

	private addOverwriteSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Overwrite')
			.setClass('control-setting')
			.addToggle((toggle) => {
				toggle.setValue(this.frontmatterSetting.overwrite).onChange(async (value) => {
					this.frontmatterSetting.overwrite = value;
				});
			});
	}

	private addCountSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
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
	}

	private addOptionsSection(containerEl: HTMLElement): void {
		// Only add options section if showOptions is enabled
		if (!this.options.showOptions) return;

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
				});
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

	private addActionButtons(containerEl: HTMLElement): void {
		const buttonContainer = containerEl.createDiv({ cls: 'modal-buttons' });

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

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
