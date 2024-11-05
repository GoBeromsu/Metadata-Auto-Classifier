import { DEFAULT_FRONTMATTER_SETTING } from 'shared/constant';
import { FrontmatterTemplate } from 'shared/constant';
import { App, TFile, getAllTags, getFrontMatterInfo } from 'obsidian';
import AutoClassifierPlugin from '../main';
import { processString } from './index';

interface FrontMatter {
	[key: string]: string[];
}

export default class FrontMatterHandler {
	private readonly app: App;
	private readonly plugin: AutoClassifierPlugin;

	constructor(plugin: AutoClassifierPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	// Insert or update a key-value pair in the frontmatter of a file
	async insertToFrontMatter(
		file: TFile,
		key: string,
		value: string[],
		overwrite = false
	): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (frontmatter: FrontMatter) => {
			// Process the value
			const processedValue = value.map(processString);

			if (frontmatter[key] && !overwrite) {
				const existingValue = frontmatter[key].map(processString);
				frontmatter[key] = [...existingValue, ...processedValue];
			} else {
				frontmatter[key] = processedValue;
			}

			// Remove duplicates and empty strings
			frontmatter[key] = [...new Set(frontmatter[key])].filter(Boolean);
		});
	}

	// Get the markdown content of a file without the frontmatter
	async getMarkdownContentWithoutFrontmatter(file: TFile): Promise<string> {
		const content = await this.app.vault.read(file);
		const { contentStart } = getFrontMatterInfo(content);
		return content.slice(contentStart).trim();
	}

	// Moved from BaseSettingsComponent
	getFrontmatterSetting(id: number): FrontmatterTemplate {
		const setting = this.plugin.settings.frontmatter.find((f) => f.id === id);
		if (!setting) {
			const newSetting = { ...DEFAULT_FRONTMATTER_SETTING, id };
			this.plugin.settings.frontmatter.push(newSetting);
			return newSetting;
		}
		return setting;
	}

	async updateFrontmatterName(setting: FrontmatterTemplate, name: string): Promise<void> {
		setting.name = name;
		await this.plugin.saveSettings();
	}

	async updateFrontmatterCount(setting: FrontmatterTemplate, count: number): Promise<void> {
		setting.count = count;
		await this.plugin.saveSettings();
	}

	async updateFrontmatterOptions(setting: FrontmatterTemplate, options: string): Promise<void> {
		setting.refs = options
			.split(',')
			.map((option) => option.trim())
			.filter((option) => option !== '');
		await this.plugin.saveSettings();
	}

	async deleteFrontmatter(id: number): Promise<void> {
		this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter((f) => f.id !== id);
		await this.plugin.saveSettings();
	}
}
