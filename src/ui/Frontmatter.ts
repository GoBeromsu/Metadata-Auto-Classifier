import { getFrontmatterSetting } from 'frontmatter';
import { Setting } from 'obsidian';
import { DEFAULT_FRONTMATTER_SETTING, FrontmatterTemplate } from 'shared/constant';
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
						await this.frontMatterHandler.updateFrontmatterOptions(frontmatterSetting, value);
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
						await this.frontMatterHandler.updateFrontmatterName(frontmatterSetting, value);
					})
			)
			.addButton((button) =>
				button
					.setButtonText('Delete')
					.setWarning()
					.onClick(async () => {
						await this.frontMatterHandler.deleteFrontmatter(frontmatterId);
						containerEl.remove();
					})
			);
	}
}
