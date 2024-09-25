import { DEFAULT_SETTINGS, DEFAULT_TAG_SETTING } from 'constant';
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from 'templatess';
import { Provider } from 'types/APIInterface';
import { APIHandler } from './api/apiHandler';

import { AutoClassifierSettings, AutoClassifierSettingTab } from './setting';
import FrontMatterHandler from 'FrontMatterHandler';

export default class AutoClassifierPlugin extends Plugin {
	apiHandler: APIHandler;

	settings: AutoClassifierSettings;
	frontMatterHandler: FrontMatterHandler;

	// Initialize the plugin
	async onload() {
		await this.loadSettings();
		this.frontMatterHandler = new FrontMatterHandler(this.app);
		this.apiHandler = new APIHandler(this.manifest, this.frontMatterHandler);

		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this, this.frontMatterHandler));
	}

	setupCommand() {
		this.settings.frontmatter.forEach((frontmatter) => {
			this.addCommand({
				id: `fetch-frontmatter-${frontmatter.id}`,
				name: `Fetch frontmatter: ${frontmatter.name}`,
				callback: async () => {
					await this.classifyMetadata(frontmatter.id);
				},
			});
		});

		this.addCommand({
			id: 'fetch-all-frontmatter',
			name: 'Fetch all frontmatter using current provider',
			callback: async () => {
				await this.processAllFrontmatter();
			},
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'F' }],
		});
	}
	// Load plugin settings
	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Check if frontmatter is empty or undefined
		if (!this.settings.frontmatter || this.settings.frontmatter.length === 0) {
			// Only add the default tag setting if frontmatter is empty
			this.settings.frontmatter = [DEFAULT_TAG_SETTING];
		}

		await this.saveSettings();
	}

	// Save plugin settings
	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Classify metadata for a specific frontmatter
	private async classifyMetadata(frontmatterId: number): Promise<void> {
		await this.processFrontmatter([frontmatterId]);
	}

	// Process all frontmatter
	private async processAllFrontmatter(): Promise<void> {
		const frontmatterIds = this.settings.frontmatter.map((fm) => fm.id);
		await this.processFrontmatter(frontmatterIds);
	}

	// Process frontmatter for given IDs
	private async processFrontmatter(frontmatterIds: number[]): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		const currentContent = await this.frontMatterHandler.getMarkdownContentWithoutFrontmatter(
			currentFile
		);
		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) return;

		for (const frontmatterId of frontmatterIds) {
			const frontmatter = this.settings.frontmatter.find((fm) => fm.id === frontmatterId);
			if (!frontmatter) {
				new Notice(`No setting found for frontmatter ID ${frontmatterId}.`);
				continue;
			}

			await this.processFrontmatterItem(selectedProvider, currentFile, currentContent, frontmatter);
		}
	}

	// Process a single frontmatter item
	private async processFrontmatterItem(
		selectedProvider: Provider,
		currentFile: TFile,
		content: string,
		frontmatter: { id: number; name: string; count: number; refs?: string[] }
	): Promise<void> {
		const currentValues = frontmatter.refs ?? [];
		const currentValuesString = currentValues.join(', ');
		const promptTemplate = getPromptTemplate(frontmatter.count, content, currentValuesString);

		const chatRole = DEFAULT_CHAT_ROLE;
		await this.apiHandler.processAPIRequest(
			chatRole,
			promptTemplate,
			selectedProvider,
			currentFile,
			frontmatter.name,
			frontmatter.count
		);
	}

	// Get the selected provider
	private getSelectedProvider(): Provider | undefined {
		const selectedProvider = this.settings.providers.find(
			(p) => p.name === this.settings.selectedProvider && p.apiKey
		);
		if (!selectedProvider) {
			new Notice('API key for the selected provider is not set.');
		}
		return selectedProvider;
	}
}
