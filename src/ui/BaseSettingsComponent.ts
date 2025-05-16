import { Setting } from 'obsidian';

import { FrontmatterTemplate } from 'utils/interface';
import AutoClassifierPlugin from '../main';
import { ConfigurableSettingModal } from './ConfigurableSettingModal';

export interface SettingsComponentOptions {
	showLinkType?: boolean;
	showOptions?: boolean;
	showTextArea?: boolean;
}

export interface SettingsComponent {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
}

export abstract class BaseSettingsComponent implements SettingsComponent {
	protected options: SettingsComponentOptions;

	constructor(protected plugin: AutoClassifierPlugin, options: SettingsComponentOptions = {}) {
		this.options = {
			showLinkType: true,
			showOptions: true,
			showTextArea: true,
			...options,
		};
	}

	abstract display(containerEl: HTMLElement, frontmatterId?: number): void;

	defaultSettings(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate,
		showDeleteButton: boolean = false
	): void {
		const setting = new Setting(containerEl)
			.setName(frontmatterSetting.name || 'Please enter name')
			.setDesc(`Type: ${frontmatterSetting.linkType}, Count: ${frontmatterSetting.count}`)
			.addButton((button) => {
				button
					.setIcon('pencil')
					.setTooltip('Edit Frontmatter')
					.onClick(() => {
						const modal = new ConfigurableSettingModal(
							this.plugin.app,
							this.plugin,
							frontmatterSetting,
							this.options
						);

						modal.open();
					});
			});

		if (showDeleteButton) {
			setting.addButton((button) => {
				button
					.setIcon('trash')
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
}
