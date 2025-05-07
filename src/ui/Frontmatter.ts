import { getFrontmatterSetting } from 'frontmatter';
import { Setting, TextAreaComponent } from 'obsidian';

import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constant';
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

		// Name setting - 최상단에 배치
		const nameSetting = new Setting(containerEl)
			.setName('Frontmatter Name')
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
			})
			.addButton((button) => {
				button
					.setIcon('trash-2')
					.setClass('delete-frontmatter-btn')
					.setCta()
					.setWarning()
					.setButtonText('Delete')
					.onClick(async (e) => {
						if (
							confirm(`Are you sure you want to delete "${frontmatterSetting.name}" frontmatter?`)
						) {
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
			});

		// 이름 필드의 너비를 넓히기 위한 스타일 조정
		const textComponent = nameSetting.controlEl.querySelector('input');
		if (textComponent) {
			textComponent.style.width = '100%';
		}

		// 컨트롤 설정 컨테이너 - Setting 컴포넌트로 변경
		const controlsContainer = containerEl.createDiv({ cls: 'frontmatter-controls-container' });

		// 1. Link Type setting
		new Setting(controlsContainer)
			.setName('Link Type')
			.setClass('control-setting')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('WikiLink', 'WikiLink')
					.addOption('Normal', 'Normal')
					.setValue(frontmatterSetting.linkType || DEFAULT_FRONTMATTER_SETTING.linkType)
					.onChange(async (value) => {
						frontmatterSetting.linkType = value as 'WikiLink' | 'Normal';
						await this.plugin.saveSettings();

						// 컨테이너 새로고침
						const frontmatterContainer = containerEl.closest('.frontmatter-container');
						if (frontmatterContainer) {
							frontmatterContainer.empty();
							frontmatterContainer.addClass('frontmatter-container');
							this.display(frontmatterContainer as HTMLElement, frontmatterSetting.id);
						}
					});
			});

		// 2. Overwrite Toggle
		new Setting(controlsContainer)
			.setName('Overwrite')
			.setClass('control-setting')
			.addToggle((toggle) => {
				toggle.setValue(frontmatterSetting.overwrite).onChange(async (value) => {
					frontmatterSetting.overwrite = value;
					await this.plugin.saveSettings();
				});
			});

		// 3. Count
		new Setting(controlsContainer)
			.setName('Count')
			.setClass('control-setting')
			.addText((text) => {
				text
					.setPlaceholder('Enter count')
					.setValue(frontmatterSetting.count.toString())
					.onChange(async (value) => {
						const count = parseInt(value, 10);
						if (!isNaN(count) && count > 0) {
							frontmatterSetting.count = count;
							await this.plugin.saveSettings();
						}
					});
			});

		// Options section
		this.addOptionsSection(containerEl, frontmatterSetting);
	}

	private textAreaComponent: TextAreaComponent; // TextAreaComponent 참조 저장용 프로퍼티

	private addOptionsSection(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate
	): void {
		// 옵션 섹션 헤더
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
							frontmatterSetting.linkType === 'WikiLink' ? `[[${selectedLink}]]` : selectedLink;
						const currentOptions = frontmatterSetting.refs || [];

						frontmatterSetting.refs = [...currentOptions, formattedLink];
						this.plugin.saveSettings().then(() => {
							this.updateOptionsTextarea(frontmatterSetting);
						});
					});
				});
		});

		const textareaContainer = containerEl.createDiv({ cls: 'textarea-container' });
		textareaContainer.style.width = '100%';
		textareaContainer.style.marginTop = '8px';

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
		// 텍스트 영역의 높이와 너비 조정
		this.textAreaComponent.inputEl.style.width = '100%';
		this.textAreaComponent.inputEl.style.minHeight = '100px';
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
