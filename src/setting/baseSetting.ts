import { Setting, Notice } from 'obsidian';
import AutoClassifierPlugin from '../main';
import { MetaDataManager } from '../metaDataManager';
import { Frontmatter } from 'types/APIInterface';

export abstract class BaseSetting {
	protected plugin: AutoClassifierPlugin;
	protected metaDataManager: MetaDataManager;

	constructor(plugin: AutoClassifierPlugin, metaDataManager: MetaDataManager) {
		this.plugin = plugin;
		this.metaDataManager = metaDataManager;
	}

	abstract display(containerEl: HTMLElement): void;

	protected addCountSetting(
		containerEl: HTMLElement,
		setting: Frontmatter,
		name: string,
		desc: string,
		defaultCount: number
	): void {
		new Setting(containerEl)
			.setName(name)
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

	protected async fetchAndSaveMetadata(
		metadataType: string,
		fetchFunction: () => Promise<string[]>
	): Promise<void> {
		const allMetadata = await fetchFunction();
		const setting = this.getSetting(metadataType);
		setting.refs = allMetadata;
		await this.plugin.saveSettings();
		new Notice(`Fetched ${allMetadata.length} ${metadataType}.`);
	}

	protected getSetting(name: string): Frontmatter {
		let setting = this.plugin.settings.frontmatter.find((m) => m.name === name);
		if (!setting) {
			setting = { name, count: 1, allowMultiple: false, refs: [] };
			this.plugin.settings.frontmatter.push(setting);
		}
		return setting;
	}

	protected addFetchButton(
		containerEl: HTMLElement,
		name: string,
		desc: string,
		fetchFunction: () => Promise<void>
	): void {
		new Setting(containerEl)
			.setName(name)
			.setDesc(desc)
			.addButton((button) => button.setButtonText(`Fetch ${name}`).setCta().onClick(fetchFunction));
	}
}
