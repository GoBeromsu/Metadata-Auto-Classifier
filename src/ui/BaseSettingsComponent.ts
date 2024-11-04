import { Setting } from 'obsidian';
import { FrontmatterTemplate } from 'shared/constant';

import AutoClassifierPlugin from '../main';
import FrontMatterHandler from 'frontmatter/FrontMatterHandler';

export interface SettingsComponent {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
}

export abstract class BaseSettingsComponent implements SettingsComponent {
	protected plugin: AutoClassifierPlugin;
	protected frontMatterHandler: FrontMatterHandler;

	constructor(plugin: AutoClassifierPlugin, frontMatterHandler: FrontMatterHandler) {
		this.plugin = plugin;
		this.frontMatterHandler = frontMatterHandler;
	}

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
							await this.frontMatterHandler.updateFrontmatterCount(setting, count);
						}
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon('reset')
					.setTooltip('Reset to default count')
					.onClick(async () => {
						await this.frontMatterHandler.updateFrontmatterCount(setting, defaultCount);
						this.display(containerEl);
					})
			);
	}
}
