import { Setting } from 'obsidian';

import AutoClassifierPlugin from '../main';
import { FrontmatterTemplate } from 'utils/interface';

export interface SettingsComponent {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
}

export abstract class BaseSettingsComponent implements SettingsComponent {
	constructor(protected plugin: AutoClassifierPlugin) {}

	abstract display(containerEl: HTMLElement, frontmatterId?: number): void;

	addCountSetting(
		containerEl: HTMLElement,
		setting: FrontmatterTemplate,
		name: string,
		desc: string,
		defaultCount: number
	): void {
		new Setting(containerEl)
			.setName(name.toLowerCase())
			.setDesc(desc)
			.addText((text) =>
				text
					.setPlaceholder('Number of items')
					.setValue(setting.count.toString())
					.onChange(async (value) => {
						const count = parseInt(value, 10);
						if (!isNaN(count) && count > 0) {
							setting.count = count;
							await this.plugin.saveSettings();
						}
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon('reset')
					.setTooltip('Reset to default count')
					.onClick(async () => {
						setting.count = defaultCount;
						await this.plugin.saveSettings();
						this.display(containerEl);
					})
			);
	}
}
