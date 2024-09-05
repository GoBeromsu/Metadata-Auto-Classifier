import { DEFAULT_SETTINGS, DEFAULT_TAG_SETTING } from 'constant';
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from 'templatess';
import { Provider } from 'types/APIInterface';
import { APIHandler } from './api/apiHandler';
import { MetaDataManager } from './metaDataManager';
import { AutoClassifierSettings, AutoClassifierSettingTab } from './setting';

export default class AutoClassifierPlugin extends Plugin {
	apiHandler: APIHandler;

	settings: AutoClassifierSettings;
	metaDataManager: MetaDataManager;

	async onload() {
		await this.loadSettings();
		this.metaDataManager = new MetaDataManager(this.app);
		this.apiHandler = new APIHandler(this.manifest, this.metaDataManager);
		this.addCommand({
			id: 'fetch-tags',
			name: 'Fetch tags using current provider',
			callback: async () => {
				await this.classifyMetadata(DEFAULT_TAG_SETTING.id);
			},
		});

		this.addCommand({
			id: 'fetch-all-frontmatter',
			name: 'Fetch all frontmatter using current provider',
			callback: async () => {
				await this.processAllFrontmatter();
			},
		});

		this.addSettingTab(new AutoClassifierSettingTab(this, this.metaDataManager));
	}

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

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async classifyMetadata(frontmatterId: number): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		const content = await this.app.vault.read(currentFile);
		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) return;

		const frontmatter = this.settings.frontmatter.find((fm) => fm.id === frontmatterId);
		if (!frontmatter) {
			new Notice(`No setting found for frontmatter ID ${frontmatterId}.`);
			return;
		}

		await this.processFrontmatterItem(selectedProvider, currentFile, content, frontmatter);
	}

	private async processAllFrontmatter(): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		const content = await this.app.vault.read(currentFile);
		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) return;

		for (const frontmatter of this.settings.frontmatter) {
			await this.processFrontmatterItem(selectedProvider, currentFile, content, frontmatter);
		}
	}

	private async processFrontmatterItem(
		selectedProvider: Provider,
		currentFile: TFile,
		content: string,
		frontmatter: { id: number; name: string; count: number; refs?: string[] }
	): Promise<void> {
		const currentValues = frontmatter.refs ?? [];
		const currentValuesString = currentValues.join(', ');
		const promptTemplate = getPromptTemplate(frontmatter.count, content, currentValuesString);

		await this.processAPIRequest(
			selectedProvider,
			currentFile,
			frontmatter.name,
			frontmatter.count,
			promptTemplate
		);
	}

	private getSelectedProvider(): Provider | undefined {
		const selectedProvider = this.settings.providers.find(
			(p) => p.name === this.settings.selectedProvider && p.apiKey
		);
		if (!selectedProvider) {
			new Notice('API key for the selected provider is not set.');
		}
		return selectedProvider;
	}

	private async processAPIRequest(
		selectedProvider: Provider,
		currentFile: TFile,
		key: string,
		count: number,
		promptTemplate: string
	): Promise<void> {
		const chatRole = DEFAULT_CHAT_ROLE;
		await this.apiHandler.processAPIRequest(
			chatRole,
			promptTemplate,
			selectedProvider,
			currentFile,
			key,
			count
		);
	}
}
