import { App, TFile } from 'obsidian';
import { FrontmatterTemplate } from 'shared/constant';
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
