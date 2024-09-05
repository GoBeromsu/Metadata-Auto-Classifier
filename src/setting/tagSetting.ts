import { App, Notice, Setting } from "obsidian";
import AutoClassifierPlugin from "../main";
import { MetaDataManager } from "../metaDataManager";
import { Frontmatter } from "./index";

export const DEFAULT_TAG_SETTING: Frontmatter = {
	name: "tags",
	refs: [] as string[],
	allowMultiple: true,
	count: 5,
};

export class TagSetting {
	plugin: AutoClassifierPlugin;
	metaDataManager: MetaDataManager;

	constructor(app: App, plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
		this.metaDataManager = new MetaDataManager(app);
	}

	display(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Tag Settings" });
		this.addTagSettings(containerEl);
		this.addFetchTagsButton(containerEl);
	}

	private addTagSettings(containerEl: HTMLElement): void {
		const tagSetting = this.getTagSetting();

		new Setting(containerEl)
			.setName("Tags")
			.setDesc("Default settings for automatic tag assignment")
			.addText((text) =>
				text
					.setPlaceholder("Number of tags")
					.setValue(tagSetting.count.toString())
					.onChange(async (value) => {
						const count = parseInt(value, 10);
						if (!isNaN(count) && count > 0) {
							tagSetting.count = count;
							await this.plugin.saveSettings();
						}
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon("reset")
					.setTooltip("Set to default count")
					.onClick(async () => {
						tagSetting.count = DEFAULT_TAG_SETTING.count;
						await this.plugin.saveSettings();
						this.display(containerEl);
					})
			);
	}

	private addFetchTagsButton(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Fetch All Tags")
			.setDesc("Fetch and save all tags from the vault")
			.addButton((button) =>
				button
					.setButtonText("Fetch Tags")
					.setCta()
					.onClick(async () => {
						await this.fetchAndSaveTags();
					})
			);
	}

	private async fetchAndSaveTags(): Promise<void> {
		const allTags = await this.metaDataManager.getAllTags();
		const tagSetting = this.getTagSetting();
		tagSetting.refs = allTags;
		await this.plugin.saveSettings();
		new Notice(`Fetched ${allTags.length} tags.`);
	}

	private getTagSetting(): Frontmatter {
		let tagSetting = this.plugin.settings.frontmatter.find(
			(m) => m.name === "tags"
		);
		if (!tagSetting) {
			tagSetting = { ...DEFAULT_TAG_SETTING };
			this.plugin.settings.frontmatter.push(tagSetting);
		}
		return tagSetting;
	}
}
