import { Setting } from 'obsidian';
import { BaseSetting } from './baseSetting';
import { DEFAULT_FRONTMATTER_SETTING } from 'constant';
import { Frontmatter } from 'types/APIInterface';

export class FrontmatterSetting extends BaseSetting {
	display(containerEl: HTMLElement): void {
		containerEl.empty();
		containerEl.createEl('h3', { text: 'Frontmatter Settings' });
		this.addFrontmatterSettings(containerEl);
	}

	private addFrontmatterSettings(containerEl: HTMLElement): void {
		const frontmatterSetting = this.getSetting('frontmatter');

		this.addNameSetting(containerEl, frontmatterSetting);
		this.addCountSetting(
			containerEl,
			frontmatterSetting,
			'Number of Options to Select',
			'Set the number of options that can be selected',
			DEFAULT_FRONTMATTER_SETTING.count
		);
		this.addAllowMultipleSetting(containerEl, frontmatterSetting);

		const optionsContainer = containerEl.createDiv('frontmatter-options');
		this.renderOptions(optionsContainer, frontmatterSetting);

		this.addAddOptionButton(containerEl, optionsContainer, frontmatterSetting);
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

	private addAllowMultipleSetting(containerEl: HTMLElement, frontmatterSetting: Frontmatter): void {
		new Setting(containerEl)
			.setName('Allow Multiple')
			.setDesc('Allow selecting multiple options')
			.addToggle((toggle) =>
				toggle.setValue(frontmatterSetting.allowMultiple).onChange(async (value) => {
					frontmatterSetting.allowMultiple = value;
					await this.plugin.saveSettings();
				})
			);
	}

	private renderOptions(container: HTMLElement, frontmatterSetting: Frontmatter): void {
		container.empty();

		if (frontmatterSetting.refs) {
			frontmatterSetting.refs.forEach((option, index) => {
				const optionSetting = new Setting(container)
					.addText((text) => {
						text.setValue(option).onChange(async (value) => {
							frontmatterSetting.refs![index] = value;
							await this.plugin.saveSettings();
						});
						return text;
					})
					.addExtraButton((button) =>
						button
							.setIcon('trash')
							.setTooltip('Delete option')
							.onClick(async () => {
								frontmatterSetting.refs!.splice(index, 1);
								await this.plugin.saveSettings();
								this.renderOptions(container, frontmatterSetting);
							})
					);

				optionSetting.controlEl.addClass('frontmatter-option');
			});
		}
	}

	private addAddOptionButton(
		containerEl: HTMLElement,
		optionsContainer: HTMLElement,
		frontmatterSetting: Frontmatter
	): void {
		new Setting(containerEl)
			.setName('Add Option')
			.setDesc('Add a new option to the frontmatter')
			.addButton((button) =>
				button
					.setButtonText('Add')
					.setCta()
					.onClick(async () => {
						if (!frontmatterSetting.refs) {
							frontmatterSetting.refs = [];
						}
						frontmatterSetting.refs.push('');
						await this.plugin.saveSettings();
						this.renderOptions(optionsContainer, frontmatterSetting);
					})
			);
	}

	protected getSetting(settingName: string): Frontmatter {
		let setting = this.plugin.settings.frontmatter.find((m) => m.name === settingName);
		if (!setting) {
			setting = { ...DEFAULT_FRONTMATTER_SETTING };
			this.plugin.settings.frontmatter.push(setting);
		}
		return setting;
	}
}
