import { DEFAULT_SETTINGS, DEFAULT_TAG_SETTING, Frontmatter } from 'constant';
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from 'templatess';
import { APIHandler } from './api/apiHandler';
import { MetaDataManager } from './metaDataManager';
import { AutoClassifierSettings, AutoClassifierSettingTab } from './setting';
import { Provider } from 'types/APIInterface';

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
				await this.classifyMetadata('tags');
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

	private async classifyMetadata(key: string): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) {
			new Notice('API key for the selected provider is not set.');
			return;
		}

		const metadataSetting = this.settings.frontmatter.find((m) => m.name === key);
		if (!metadataSetting) {
			new Notice(`No setting found for ${key}.`);
			return;
		}

		const count = metadataSetting.count;
		const content = await this.app.vault.read(currentFile);
		const currentValues = metadataSetting.refs ?? [];

		const promptTemplate = this.preparePromptTemplate(count, content, currentValues);

		await this.processAPIRequest(selectedProvider, currentFile, key, count, promptTemplate);
	}

	private getSelectedProvider(): Provider | undefined {
		return this.settings.providers.find(
			(p) => p.name === this.settings.selectedProvider && p.apiKey
		);
	}

	private preparePromptTemplate(count: number, content: string, currentValues: string[]): string {
		const currentValuesString = currentValues.join(', ');
		return getPromptTemplate(true, count, content, currentValuesString);
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

	async processAllFrontmatter(): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		for (const frontmatter of this.settings.frontmatter) {
			await this.classifyMetadata(frontmatter.name);
		}
	}
}
