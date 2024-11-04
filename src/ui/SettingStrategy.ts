import { Setting } from 'obsidian';
import { DEFAULT_FRONTMATTER_SETTING, FrontmatterTemplate } from '../api/constant';

import FrontMatterHandler from 'utils/FrontMatterHandler';
import AutoClassifierPlugin from '../main';
export interface SettingStrategy {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
	getFrontmatterSetting(id: number): FrontmatterTemplate;
	addCountSetting(
		containerEl: HTMLElement,
		setting: FrontmatterTemplate,
		name: string,
		desc: string,
		defaultCount: number
	): void;
}

export abstract class BaseSettingStrategy implements SettingStrategy {
	protected plugin: AutoClassifierPlugin;
	protected frontMatterHandler: FrontMatterHandler;

	constructor(plugin: AutoClassifierPlugin, metaDataManager: FrontMatterHandler) {
		this.plugin = plugin;
		this.frontMatterHandler = metaDataManager;
	}

	abstract display(containerEl: HTMLElement, frontmatterId?: number): void;

	getFrontmatterSetting(id: number): FrontmatterTemplate {
		const setting = this.plugin.settings.frontmatter.find((f) => f.id === id);
		if (!setting) {
			const newSetting = { ...DEFAULT_FRONTMATTER_SETTING, id };
			this.plugin.settings.frontmatter.push(newSetting);
			return newSetting;
		}
		return setting;
	}
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
