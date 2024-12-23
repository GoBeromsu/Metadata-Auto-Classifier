import { getFrontmatterSetting } from 'frontmatter';
import { Setting } from 'obsidian';

import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constant';
import { FrontmatterTemplate } from 'utils/interface';
import { BaseSettingsComponent } from './BaseSettingsComponent';
export class Frontmatter extends BaseSettingsComponent {
	display(containerEl: HTMLElement, frontmatterId: number): void {
		containerEl.empty();
		this.addFrontmatterSettings(containerEl, frontmatterId);
	}

	private addFrontmatterSettings(containerEl: HTMLElement, frontmatterId: number): void {
		const frontmatterSetting = getFrontmatterSetting(
			frontmatterId,
			this.plugin.settings.frontmatter
		);

		this.addNameSetting(containerEl, frontmatterSetting, frontmatterId);
		this.addOverwriteSetting(containerEl, frontmatterSetting);
		this.addCountSetting(
			containerEl,
			frontmatterSetting,
			'Number of options to select',
			'Set the number of options that can be selected',
			DEFAULT_FRONTMATTER_SETTING.count
		);

		this.addOptionsSetting(containerEl, frontmatterSetting);
	}

	private addOptionsSetting(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate
	): void {
		new Setting(containerEl)
			.setName('Options')
			.setDesc('Enter options separated by commas')
			.addTextArea((text) => {
				text
					.setPlaceholder('Option1, Option2, Option3')
					.setValue(frontmatterSetting.refs ? frontmatterSetting.refs.join(', ') : '')
					.onChange(async (value) => {
						frontmatterSetting.refs = value
							.split(',')
							.map((option) => option.trim())
							.filter((option) => option !== '');
						await this.plugin.saveSettings();
					});
				text.inputEl.addClass('frontmatter-options-textarea');
			});
	}

	private addNameSetting(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate,
		frontmatterId: number
	): void {
		new Setting(containerEl)
			.setName('Frontmatter name')
			.setDesc('Set the name for this frontmatter')
			.addText((text) =>
				text
					.setPlaceholder('Enter frontmatter name')
					.setValue(frontmatterSetting.name)
					.onChange(async (value) => {
						frontmatterSetting.name = value;
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) =>
				button
					.setButtonText('Delete')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
							(f) => f.id !== frontmatterId
						);
						await this.plugin.saveSettings();
						containerEl.remove();
					})
			);
	}
}
