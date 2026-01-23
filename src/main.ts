import type { TFile } from 'obsidian';
import { Plugin } from 'obsidian';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import type { ProviderConfig } from './api/types';
import type { FrontmatterField } from './frontmatter/types';
import { ClassificationService, CommandService } from './services';
import type { AutoClassifierSettings } from './ui';
import { AutoClassifierSettingTab } from './ui';
import { DEFAULT_FRONTMATTER_SETTING, DEFAULT_SETTINGS } from './utils/constants';

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;
	private classificationService: ClassificationService | null = null;
	private commandService: CommandService | null = null;

	async onload() {
		await this.loadSettings();
		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this));
	}

	setupCommand() {
		this.commandService = new CommandService(this, {
			processFrontmatter: (id) => this.processFrontmatter(id),
			processAllFrontmatter: () => this.processAllFrontmatter(),
		});
		this.commandService.setupCommands(this.settings.frontmatter);
	}

	registerCommand(name: string, callback: () => Promise<void>) {
		this.addCommand({
			id: `fetch-frontmatter-${name}`,
			name: `Fetch frontmatter: ${name}`,
			callback: async () => await callback(),
		});
	}

	async processAllFrontmatter(): Promise<void> {
		const frontmatterIds = this.settings.frontmatter.map((fm) => fm.id);
		for (const frontmatterId of frontmatterIds) {
			await this.processFrontmatter(frontmatterId);
		}
	}

	async processFrontmatter(frontmatterId: number): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			const error = new Error('No active file.');
			CommonNotice.error(error);
			return;
		}

		let selectedProvider: ProviderConfig | null = null;
		try {
			selectedProvider = this.getSelectedProvider();
		} catch {
			const error = new Error('No provider selected.');
			CommonNotice.error(error);
			return;
		}

		const frontmatter = this.settings.frontmatter.find((fm) => fm.id === frontmatterId);
		if (!frontmatter) {
			const error = new Error(`No setting found for frontmatter ID ${frontmatterId}.`);
			CommonNotice.error(error);
			return;
		}

		await this.classifyFrontmatter(selectedProvider, currentFile, frontmatter);
	}

	private async classifyFrontmatter(
		provider: ProviderConfig,
		file: TFile,
		frontmatter: FrontmatterField
	): Promise<void> {
		this.classificationService = new ClassificationService({
			app: this.app,
			provider,
			model: this.settings.selectedModel,
			classificationRule: this.settings.classificationRule,
			saveSettings: () => this.saveSettings(),
		});

		await this.classificationService.classify(file, frontmatter);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Migrate old frontmatter settings that may be missing count
		this.settings.frontmatter = this.settings.frontmatter.map((fm) => ({
			...DEFAULT_FRONTMATTER_SETTING,
			...fm,
			count: fm.count ?? { min: 1, max: 5 },
		}));

		await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	public getSelectedProvider(): ProviderConfig {
		const provider = this.settings.providers.find(
			(provider) => provider.name === this.settings.selectedProvider
		);
		if (!provider) throw new Error('Selected provider not found');

		return provider;
	}
}
