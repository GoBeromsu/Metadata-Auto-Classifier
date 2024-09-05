import { Setting } from 'obsidian';
import { BaseSetting } from './baseSetting';
import { DEFAULT_FRONTMATTER_SETTING, Frontmatter } from 'constant';

export class FrontmatterSetting extends BaseSetting {
	display(containerEl: HTMLElement, frontmatterId: number): void {
		containerEl.empty();
		this.addFrontmatterSettings(containerEl, frontmatterId);
	}

	private addFrontmatterSettings(containerEl: HTMLElement, frontmatterId: number): void {
		const frontmatterSetting = this.getSetting(frontmatterId);

		this.addNameSetting(containerEl, frontmatterSetting);
		this.addCountSetting(
			containerEl,
			frontmatterSetting,
			'Number of Options to Select',
			'Set the number of options that can be selected',
			DEFAULT_FRONTMATTER_SETTING.count
		);

		this.addOptionsSetting(containerEl, frontmatterSetting);
	}

	private addNameSetting(containerEl: HTMLElement, frontmatterSetting: Frontmatter): void {
		new Setting(containerEl)
			.setName('Frontmatter Name')
			.setDesc('Set the name for this frontmatter')
			.addText((text) =>
				text
					.setPlaceholder('Enter frontmatter name')
					.setValue(frontmatterSetting.name)
					.onChange(async (value) => {
						frontmatterSetting.name = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private addOptionsSetting(containerEl: HTMLElement, frontmatterSetting: Frontmatter): void {
		new Setting(containerEl)
			.setName('Options')
			.setDesc('Enter options separated by commas')
			.addTextArea((text) =>
				text
					.setPlaceholder('Option1, Option2, Option3')
					.setValue(frontmatterSetting.refs ? frontmatterSetting.refs.join(', ') : '')
					.onChange(async (value) => {
						frontmatterSetting.refs = value
							.split(',')
							.map((option) => option.trim())
							.filter((option) => option !== '');
						await this.plugin.saveSettings();
					})
			);
	}

	protected getSetting(frontmatterId: number): Frontmatter {
		let setting = this.plugin.settings.frontmatter.find((m) => m.id === frontmatterId);
		if (!setting) {
			setting = { ...DEFAULT_FRONTMATTER_SETTING, id: frontmatterId };
			this.plugin.settings.frontmatter.push(setting);
		}
		return setting;
	}
}
