import { DEFAULT_SETTINGS, DEFAULT_TAG_SETTING, Frontmatter } from 'constant';
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from 'templatess';
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
				await this.classifyTags();
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

	async classifyTags(): Promise<void> {
		// 1. Check API Key
		const selectedProvider = this.settings.providers.find(
			(p) => p.name === this.settings.selectedProvider
		);
		if (!selectedProvider || !selectedProvider.apiKey) {
			new Notice('API key for the selected provider is not set.');
			return;
		}

		// 2. Get input (content of the current file)
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		// 3. Prepare input and prompt
		const tagSetting = this.settings.frontmatter.find((m) => m.name === 'tags');
		const tagCount = tagSetting ? tagSetting.count : 3;
		const content = await this.app.vault.read(currentFile);
		const chatRole = DEFAULT_CHAT_ROLE;

		const currentTags = tagSetting?.refs || [];
		const currentTagsString = currentTags.join(', ');

		const promptTemplate = getPromptTemplate(true, tagCount, content, currentTagsString);

		// 4. Call API and process response
		await this.apiHandler.processAPIRequest(
			chatRole,
			promptTemplate,
			selectedProvider,
			currentFile,
			'tags',
			tagCount
		);
	}

	async processAllFrontmatter(): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		for (const frontmatter of this.settings.frontmatter) {
			if (frontmatter.name !== 'tags') {
				// Skip 'tags' as it's handled separately
				await this.classifyFrontmatter(frontmatter, currentFile);
			}
		}

		// Process tags separately
		const tagSetting = this.settings.frontmatter.find((m) => m.name === 'tags');
		if (tagSetting) {
			await this.classifyTags();
		}
	}

	async classifyFrontmatter(frontmatter: Frontmatter, currentFile: TFile): Promise<void> {
		// 1. Check API Key
		const selectedProvider = this.settings.providers.find(
			(p) => p.name === this.settings.selectedProvider
		);
		if (!selectedProvider || !selectedProvider.apiKey) {
			new Notice('API key for the selected provider is not set.');
			return;
		}

		// 2. Prepare input and prompt
		const content = await this.app.vault.read(currentFile);
		const chatRole = DEFAULT_CHAT_ROLE;

		// Get current frontmatter values from the settings
		const currentValues = frontmatter.refs || [];
		console.log(`Saved frontmatter values for ${frontmatter.name}:`, currentValues);

		const currentValuesString = currentValues.join(', ');

		console.log(`Processed frontmatter value for ${frontmatter.name}:`, currentValuesString);

		// Prepare prompt template
		const promptTemplate = getPromptTemplate(true, frontmatter.count, content, currentValuesString);

		// Log the prepared prompt template
		console.log(`Prompt template for ${frontmatter.name}:`, promptTemplate);

		// Call API and process response
		const result = await this.apiHandler.processAPIRequest(
			chatRole,
			promptTemplate,
			selectedProvider,
			currentFile,
			frontmatter.name,
			frontmatter.count
		);
		console.log(result);
	}
}
