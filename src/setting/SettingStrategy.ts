import { Notice, Setting } from 'obsidian';
import { DEFAULT_FRONTMATTER_SETTING, FrontmatterTemplate } from '../constant';
import AutoClassifierPlugin from '../main';
import { MetaDataManager } from '../metaDataManager';

export interface SettingStrategy {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
	getSetting(id: number): FrontmatterTemplate;
	addCountSetting(
		containerEl: HTMLElement,
		setting: FrontmatterTemplate,
		name: string,
		desc: string,
		defaultCount: number
	): void;
	fetchAndSaveMetadata(id: number, fetchFunction: () => Promise<string[]>): Promise<void>;
	addFetchButton(
		containerEl: HTMLElement,
		name: string,
		desc: string,
		fetchFunction: () => Promise<void>
	): void;
}

export abstract class BaseSettingStrategy implements SettingStrategy {
	protected plugin: AutoClassifierPlugin;
	protected metaDataManager: MetaDataManager;

	constructor(plugin: AutoClassifierPlugin, metaDataManager: MetaDataManager) {
		this.plugin = plugin;
		this.metaDataManager = metaDataManager;
	}

	abstract display(containerEl: HTMLElement, frontmatterId?: number): void;

	getSetting(id: number): FrontmatterTemplate {
		const setting = this.plugin.settings.frontmatter.find((f) => f.id === id);
		if (setting) {
			return setting;
		} else {
			const newSetting = { ...DEFAULT_FRONTMATTER_SETTING, id };
			this.plugin.settings.frontmatter.push(newSetting);
			return newSetting;
		}
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
	async fetchAndSaveMetadata(id: number, fetchFunction: () => Promise<string[]>): Promise<void> {
		const allMetadata = await fetchFunction();
		const setting = this.getSetting(id);
		setting.refs = allMetadata;
		await this.plugin.saveSettings();
		new Notice(`Fetched ${allMetadata.length} ${id}.`);
	}
	addFetchButton(
		containerEl: HTMLElement,
		name: string,
		desc: string,
		fetchFunction: () => Promise<void>
	): void {
		new Setting(containerEl)
			.setName(name.toLowerCase())
			.setDesc(desc)
			.addButton((button) => button.setButtonText(`Fetch ${name}`).setCta().onClick(fetchFunction));
	}
}
