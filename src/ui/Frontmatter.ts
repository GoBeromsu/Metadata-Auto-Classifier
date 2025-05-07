import { getFrontmatterSetting } from 'frontmatter';
import {
	setIcon,
	Setting,
	DropdownComponent,
	ToggleComponent,
	ButtonComponent,
	TextComponent,
	TextAreaComponent,
} from 'obsidian';

import { FrontmatterTemplate } from 'utils/interface';
import { BaseSettingsComponent } from './BaseSettingsComponent';
import { WikiLinkSelector } from './WikiLinkSelector';

export class Frontmatter extends BaseSettingsComponent {
	display(containerEl: HTMLElement, frontmatterId: number): void {
		containerEl.empty();

		// Add a class to identify this as a frontmatter container
		containerEl.addClass('frontmatter-container');
		containerEl.setAttribute('data-frontmatter-id', frontmatterId.toString());

		// Create card-like container for better visual grouping
		const cardEl = containerEl.createDiv({ cls: 'frontmatter-card' });

		this.addFrontmatterSettings(cardEl, frontmatterId);
	}

	private addFrontmatterSettings(containerEl: HTMLElement, frontmatterId: number): void {
		const frontmatterSetting = getFrontmatterSetting(
			frontmatterId,
			this.plugin.settings.frontmatter
		);

		// Add header with name and delete button
		this.addHeaderSection(containerEl, frontmatterSetting, frontmatterId);

		// Settings container
		const settingsContainer = containerEl.createDiv({ cls: 'frontmatter-settings-container' });
		const settingsRow = settingsContainer.createDiv({ cls: 'frontmatter-controls-row' });

		// 1. Link Type setting
		const linkTypeContainer = settingsRow.createDiv({ cls: 'control-item link-type-control' });
		const linkTypeLabel = linkTypeContainer.createDiv({ cls: 'control-label' });
		setIcon(linkTypeLabel, 'link');
		linkTypeLabel.createSpan({ text: 'Link Type' });

		new DropdownComponent(linkTypeContainer)
			.addOption('Normal', 'Normal')
			.addOption('WikiLink', 'WikiLink')
			.setValue(frontmatterSetting.linkType || 'Normal')
			.onChange(async (value) => {
				frontmatterSetting.linkType = value as 'Normal' | 'WikiLink';
				await this.plugin.saveSettings();

				// 컨테이너 새로고침
				const frontmatterContainer = containerEl.closest('.frontmatter-container');
				if (frontmatterContainer) {
					frontmatterContainer.empty();
					frontmatterContainer.addClass('frontmatter-container');
					this.display(frontmatterContainer as HTMLElement, frontmatterSetting.id);
				}
			});

		// 2. Overwrite Toggle
		const overwriteContainer = settingsRow.createDiv({ cls: 'control-item overwrite-control' });
		const overwriteLabel = overwriteContainer.createDiv({ cls: 'control-label' });
		setIcon(overwriteLabel, 'refresh-cw');
		overwriteLabel.createSpan({ text: 'Overwrite' });

		const toggleContainer = overwriteContainer.createDiv({ cls: 'control-input toggle-wrapper' });
		new ToggleComponent(toggleContainer)
			.setValue(frontmatterSetting.overwrite)
			.onChange(async (value) => {
				frontmatterSetting.overwrite = value;
				await this.plugin.saveSettings();
			});

		// 3. Count
		const countContainer = settingsRow.createDiv({ cls: 'control-item count-control' });
		const countLabel = countContainer.createDiv({ cls: 'control-label' });
		setIcon(countLabel, 'hash');
		countLabel.createSpan({ text: 'Count' });

		new TextComponent(countContainer)
			.setPlaceholder('Enter count')
			.setValue(frontmatterSetting.count.toString())
			.onChange(async (value) => {
				const count = parseInt(value, 10);
				if (!isNaN(count) && count > 0) {
					frontmatterSetting.count = count;
					await this.plugin.saveSettings();
				}
			});

		// 4. Delete button
		const deleteContainer = settingsRow.createDiv({ cls: 'control-item delete-control' });
		const deleteLabel = deleteContainer.createDiv({ cls: 'control-label' });
		setIcon(deleteLabel, 'trash-2');
		deleteLabel.createSpan({ text: 'Delete' });

		const deleteButtonContainer = deleteContainer.createDiv({
			cls: 'control-input delete-btn-wrapper',
		});

		new ButtonComponent(deleteButtonContainer)
			.setIcon('trash-2')
			.setClass('delete-frontmatter-btn')
			.onClick(async (e) => {
				e.stopPropagation();
				e.preventDefault();

				if (confirm(`Are you sure you want to delete "${frontmatterSetting.name}" frontmatter?`)) {
					this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
						(f) => f.id !== frontmatterId
					);
					await this.plugin.saveSettings();

					const parentContainer = containerEl.closest('.frontmatter-container');
					if (parentContainer) {
						parentContainer.remove();
					}
				}
			});

		// Options section
		this.addOptionsSection(settingsContainer, frontmatterSetting);
	}

	private addHeaderSection(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate,
		frontmatterId: number
	): void {
		const headerEl = containerEl.createDiv({ cls: 'frontmatter-header' });

		// Setting 컴포넌트로 변경
		new Setting(headerEl)
			.setName('Frontmatter Key')
			.setClass('frontmatter-name-setting')
			.addText((text) => {
				text
					.setPlaceholder('Enter frontmatter name')
					.setValue(frontmatterSetting.name)
					.onChange(async (value) => {
						frontmatterSetting.name = value;
					})
					.inputEl.addEventListener('blur', async () => {
						await this.plugin.saveSettings();
					});
			});
	}

	private textAreaComponent: TextAreaComponent; // TextAreaComponent 참조 저장용 프로퍼티

	private addOptionsSection(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate
	): void {
		const sectionContainer = containerEl.createDiv({ cls: 'options-section' });

		// 헤더를 Setting 컴포넌트로 변경
		const optionsHeaderSetting = new Setting(sectionContainer)
			.setName('Available Options')
			.setClass('options-header')
			.setHeading();

		// Add browse button if WikiLink type
		if (frontmatterSetting.linkType === 'WikiLink') {
			optionsHeaderSetting.addButton((button) => {
				button
					.setIcon('folder')
					.setClass('browse-button')
					.setButtonText('Browse Files')
					.onClick(() => {
						const wikiLinkSelector = new WikiLinkSelector(this.plugin.app);
						wikiLinkSelector.openFileSelector((selectedLink) => {
							const formattedLink = `[[${selectedLink}]]`;
							const currentOptions = frontmatterSetting.refs || [];

							frontmatterSetting.refs = [...currentOptions, formattedLink];
							this.plugin.saveSettings().then(() => {
								this.updateOptionsTextarea(frontmatterSetting);
							});
						});
					});
			});
		}

		// Description을 Setting 컴포넌트로 변경
		new Setting(sectionContainer)
			.setDesc('Enter values that the AI can use as suggestions, separated by commas.')
			.setClass('options-description');

		// Textarea for options
		const textareaContainer = sectionContainer.createDiv({ cls: 'textarea-container' });

		let displayValue = '';
		if (frontmatterSetting.refs && frontmatterSetting.refs.length > 0) {
			displayValue = frontmatterSetting.refs.join(', ');
		}

		this.textAreaComponent = new TextAreaComponent(textareaContainer)
			.setPlaceholder('Option1, Option2, Option3...')
			.setValue(displayValue)
			.onChange(async (value) => {
				const inputOptions = value
					.split(',')
					.map((option) => option.trim())
					.filter(Boolean);

				frontmatterSetting.refs = inputOptions;
				await this.plugin.saveSettings();
			});
	}

	private updateOptionsTextarea(frontmatterSetting: FrontmatterTemplate): void {
		if (this.textAreaComponent) {
			let displayValue = '';
			if (frontmatterSetting.refs && frontmatterSetting.refs.length > 0) {
				displayValue = frontmatterSetting.refs.join(', ');
			}
			this.textAreaComponent.setValue(displayValue);
		}
	}
}
