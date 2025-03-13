import { getFrontmatterSetting } from 'frontmatter';
import { Notice, Setting, setIcon } from 'obsidian';

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

		// Add header with name and delete button (삭제 버튼은 옮길 예정)
		this.addHeaderSection(containerEl, frontmatterSetting, frontmatterId);

		// 모든 주요 설정을 하나의 행에 배치
		const settingsContainer = containerEl.createDiv({ cls: 'frontmatter-settings-container' });
		const settingsRow = settingsContainer.createDiv({ cls: 'frontmatter-controls-row' });

		// 1. Link Type (아이콘 + 드롭다운)
		const linkTypeContainer = settingsRow.createDiv({ cls: 'control-item link-type-control' });
		const linkTypeLabel = linkTypeContainer.createDiv({ cls: 'control-label' });
		setIcon(linkTypeLabel, 'link');
		linkTypeLabel.createSpan({ text: 'Link Type' });

		// 드롭다운 컨테이너
		const select = linkTypeContainer.createEl('select', { cls: 'dropdown control-input' });

		const normalOption = select.createEl('option', { text: 'Normal' });
		normalOption.value = 'Normal';

		const wikiOption = select.createEl('option', { text: 'Wiki Link' });
		wikiOption.value = 'WikiLink';

		// 현재 값 설정
		select.value = frontmatterSetting.linkType || 'Normal';

		// 변경 핸들러
		select.addEventListener('change', async () => {
			const value = select.value as 'Normal' | 'WikiLink';
			frontmatterSetting.linkType = value;
			await this.plugin.saveSettings();

			// 컨테이너 새로고침
			const frontmatterContainer = containerEl.closest('.frontmatter-container');
			if (frontmatterContainer) {
				frontmatterContainer.empty();
				frontmatterContainer.addClass('frontmatter-container');
				this.display(frontmatterContainer as HTMLElement, frontmatterSetting.id);
			}
		});

		// 2. Overwrite Toggle (아이콘 + 토글)
		const overwriteContainer = settingsRow.createDiv({ cls: 'control-item overwrite-control' });
		const overwriteLabel = overwriteContainer.createDiv({ cls: 'control-label' });
		setIcon(overwriteLabel, 'refresh-cw');
		overwriteLabel.createSpan({ text: 'Overwrite' });

		// 토글 컨테이너
		const toggleContainer = overwriteContainer.createDiv({ cls: 'control-input toggle-wrapper' });
		const toggleLabel = toggleContainer.createEl('label', { cls: 'toggle' });
		const checkbox = toggleLabel.createEl('input', { type: 'checkbox' });
		checkbox.checked = frontmatterSetting.overwrite;
		toggleLabel.createEl('span', { cls: 'toggle-slider' });

		checkbox.addEventListener('change', async () => {
			frontmatterSetting.overwrite = checkbox.checked;
			await this.plugin.saveSettings();
		});

		// 3. Count (아이콘 + 입력)
		const countContainer = settingsRow.createDiv({ cls: 'control-item count-control' });
		const countLabel = countContainer.createDiv({ cls: 'control-label' });
		setIcon(countLabel, 'hash');
		countLabel.createSpan({ text: 'Count' });

		// 카운트 입력
		const countInput = countContainer.createEl('input', {
			type: 'number',
			value: frontmatterSetting.count.toString(),
			cls: 'control-input number-input',
			attr: {
				min: '1',
				max: '20',
			},
		});

		countInput.addEventListener('change', async () => {
			const count = parseInt(countInput.value, 10);
			if (!isNaN(count) && count > 0) {
				frontmatterSetting.count = count;
				await this.plugin.saveSettings();
			}
		});

		// 4. 삭제 버튼 (헤더에서 컨트롤 영역으로 이동)
		const deleteContainer = settingsRow.createDiv({ cls: 'control-item delete-control' });
		const deleteLabel = deleteContainer.createDiv({ cls: 'control-label' });
		setIcon(deleteLabel, 'trash-2');
		deleteLabel.createSpan({ text: 'Delete' });

		// 삭제 버튼 컨테이너
		const deleteButtonContainer = deleteContainer.createDiv({
			cls: 'control-input delete-btn-wrapper',
		});
		const deleteButton = deleteButtonContainer.createDiv({ cls: 'delete-frontmatter-btn' });
		setIcon(deleteButton, 'trash-2');

		deleteButton.addEventListener('click', async (e) => {
			// 이벤트 버블링 방지
			e.stopPropagation();
			e.preventDefault();

			// 확인 다이얼로그
			if (confirm(`Are you sure you want to delete "${frontmatterSetting.name}" frontmatter?`)) {
				this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
					(f) => f.id !== frontmatterId
				);
				await this.plugin.saveSettings();

				// 상위 컨테이너 찾기 및 제거
				const parentContainer = containerEl.closest('.frontmatter-container');
				if (parentContainer) {
					parentContainer.remove();
				}
			}
		});

		// Options section (available options)
		this.addOptionsSection(settingsContainer, frontmatterSetting);
	}

	private addHeaderSection(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate,
		frontmatterId: number
	): void {
		const headerEl = containerEl.createDiv({ cls: 'frontmatter-header' });

		// Create name input container
		const nameContainer = headerEl.createDiv({ cls: 'frontmatter-name-container' });

		// Add a label
		nameContainer.createEl('label', { text: 'Frontmatter Key', cls: 'frontmatter-label' });

		// Add name input
		const nameInput = nameContainer.createEl('input', {
			type: 'text',
			value: frontmatterSetting.name,
			placeholder: 'Enter frontmatter name',
			cls: 'frontmatter-name-input',
		});

		// input 값이 변경될 때마다 (키 입력 중에) 값을 업데이트
		nameInput.addEventListener('input', async () => {
			frontmatterSetting.name = nameInput.value;
		});

		// 포커스를 잃었을 때 저장 - 이름이 즉시 저장되도록
		nameInput.addEventListener('blur', async () => {
			await this.plugin.saveSettings();
		});

		// 엔터 키로도 저장 가능하도록
		nameInput.addEventListener('keydown', async (e) => {
			if (e.key === 'Enter') {
				await this.plugin.saveSettings();
				nameInput.blur();
			}
		});

		// 삭제 버튼은 컨트롤 영역으로 이동했으므로 여기서는 제거
	}

	private addOptionsSection(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate
	): void {
		const sectionContainer = containerEl.createDiv({ cls: 'options-section' });

		// Add section header with label and browse button
		const sectionHeader = sectionContainer.createDiv({ cls: 'options-header' });
		sectionHeader.createEl('h3', { text: 'Available Options', cls: 'options-title' });

		// Add browse button if WikiLink type (with icon)
		if (frontmatterSetting.linkType === 'WikiLink') {
			const browseButton = sectionHeader.createDiv({ cls: 'browse-button' });
			setIcon(browseButton, 'folder');
			browseButton.createSpan({ text: 'Browse Files' });

			browseButton.addEventListener('click', () => {
				const wikiLinkSelector = new WikiLinkSelector(this.plugin.app);
				wikiLinkSelector.openFileSelector((selectedLink) => {
					// Get the current options
					const currentOptions = frontmatterSetting.refs || [];

					// Add the selected link if it's not already in the list
					if (!currentOptions.includes(selectedLink)) {
						frontmatterSetting.refs = [...currentOptions, selectedLink];
						this.plugin.saveSettings().then(() => {
							// Update the textarea
							this.updateOptionsTextarea(sectionContainer, frontmatterSetting);
						});
					}
				});
			});
		}

		// Options description
		sectionContainer.createEl('p', {
			text: 'Enter values that the AI can use as suggestions, separated by commas.',
			cls: 'options-description',
		});

		// Textarea for options
		const textareaContainer = sectionContainer.createDiv({ cls: 'textarea-container' });
		const textarea = textareaContainer.createEl('textarea', {
			cls: 'options-textarea',
			placeholder: 'Option1, Option2, Option3...',
		});

		// Format and set current values
		let displayValue = '';
		if (frontmatterSetting.refs && frontmatterSetting.refs.length > 0) {
			// If it's WikiLink type, show them with [[]] for better visualization
			if (frontmatterSetting.linkType === 'WikiLink') {
				displayValue = frontmatterSetting.refs.map((ref) => `[[${ref}]]`).join(', ');
			} else {
				displayValue = frontmatterSetting.refs.join(', ');
			}
		}
		textarea.value = displayValue;

		// Add change handler
		textarea.addEventListener('change', async () => {
			// When saving, remove the [[]] if it's WikiLink type
			if (frontmatterSetting.linkType === 'WikiLink') {
				frontmatterSetting.refs = textarea.value
					.split(',')
					.map((option) => {
						// 외부 공백만 제거
						const trimmedOption = option.trim();
						// Remove [[]] if present, preserve internal spaces
						if (trimmedOption.startsWith('[[') && trimmedOption.endsWith(']]')) {
							return trimmedOption.slice(2, -2); // 내부 공백 유지
						}
						return trimmedOption;
					})
					.filter(Boolean);
			} else {
				frontmatterSetting.refs = textarea.value
					.split(',')
					.map((option) => option.trim())
					.filter(Boolean);
			}
			await this.plugin.saveSettings();
		});
	}

	private updateOptionsTextarea(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate
	): void {
		const textarea = containerEl.querySelector('.options-textarea');
		if (textarea) {
			// Format based on link type
			let displayValue = '';
			if (frontmatterSetting.refs && frontmatterSetting.refs.length > 0) {
				if (frontmatterSetting.linkType === 'WikiLink') {
					displayValue = frontmatterSetting.refs.map((ref) => `[[${ref}]]`).join(', ');
				} else {
					displayValue = frontmatterSetting.refs.join(', ');
				}
			}
			(textarea as HTMLTextAreaElement).value = displayValue;
		}
	}
}
