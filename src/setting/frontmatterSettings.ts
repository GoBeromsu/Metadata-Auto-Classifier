import { Setting } from 'obsidian';
import AutoClassifierPlugin from '../main';
import { MetaDataManager } from '../metaDataManager';

import { DEFAULT_FRONTMATTER_SETTING } from 'constant';
import { Frontmatter } from 'types/APIInterface';

export class FrontmatterSetting {
	plugin: AutoClassifierPlugin;
	metaDataManager: MetaDataManager;

	constructor(plugin: AutoClassifierPlugin, metaDataManager: MetaDataManager) {
		this.plugin = plugin;
		this.metaDataManager = metaDataManager;
	}

	display(containerEl: HTMLElement): void {
		containerEl.empty();
		containerEl.createEl('h3', { text: 'Frontmatter Settings' });
		this.addFrontmatterSettings(containerEl);
	}

	private addFrontmatterSettings(containerEl: HTMLElement): void {
		const frontmatterSetting = this.getFrontmatterSetting();

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

		new Setting(containerEl)
			.setName('Number of Options to Select')
			.setDesc('Set the number of options that can be selected')
			.addText((text) =>
				text
					.setPlaceholder('Number of options')
					.setValue(frontmatterSetting.count.toString())
					.onChange(async (value) => {
						const count = parseInt(value, 10);
						if (!isNaN(count) && count > 0) {
							frontmatterSetting.count = count;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName('Allow Multiple')
			.setDesc('Allow selecting multiple options')
			.addToggle((toggle) =>
				toggle.setValue(frontmatterSetting.allowMultiple).onChange(async (value) => {
					frontmatterSetting.allowMultiple = value;
					await this.plugin.saveSettings();
				})
			);

		const optionsContainer = containerEl.createDiv('frontmatter-options');
		this.renderOptions(optionsContainer, frontmatterSetting);

		new Setting(containerEl).addButton((button) =>
			button
				.setButtonText('Add Option')
				.setCta()
				.onClick(() => {
					if (!frontmatterSetting.refs) {
						frontmatterSetting.refs = [];
					}
					frontmatterSetting.refs.push('');
					this.renderOptions(optionsContainer, frontmatterSetting);
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

	private getFrontmatterSetting(): Frontmatter {
		let frontmatterSetting = this.plugin.settings.frontmatter.find((m) => m.name === 'frontmatter');
		if (!frontmatterSetting) {
			frontmatterSetting = { ...DEFAULT_FRONTMATTER_SETTING };
			this.plugin.settings.frontmatter.push(frontmatterSetting);
		}
		return frontmatterSetting;
	}
}
