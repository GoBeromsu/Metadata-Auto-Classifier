import { Notice, Plugin } from "obsidian";
import {
	AutoClassifierSettings,
	DEFAULT_SETTINGS,
	AutoClassifierSettingTab,
} from "./settings";
import { AIFactory } from "api";
import { MetaDataManager } from "./metaDataManager";
import { DEFAULT_CHAT_ROLE, DEFAULT_PROMPT_TEMPLATE } from "templatess";

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;
	metaDataManager: MetaDataManager;

	async onload() {
		await this.loadSettings();
		this.metaDataManager = new MetaDataManager(this.app);
		this.addCommand({
			id: "fetch-tags",
			name: "Fetch tags using current provider",
			callback: async () => {
				await this.classifyTags();
			},
		});

		this.addSettingTab(new AutoClassifierSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async classifyTags(): Promise<void> {
		// 1. Check API Key
		const selectedProvider = this.settings.apiProviders.find(
			(p) => p.name === this.settings.selectedProvider
		);
		if (!selectedProvider || !selectedProvider.apiKey) {
			new Notice("API key for the selected provider is not set.");
			return;
		}

		// 2. Get input (content of the current file)
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice("No active file.");
			return;
		}

		const tagSetting = this.settings.frontmatter.find(
			(m) => m.name === "tags"
		);
		const tagCount = tagSetting ? tagSetting.count : 3;

		try {
			const content = await this.app.vault.read(currentFile);
			const chatRole = DEFAULT_CHAT_ROLE;
			const promptTemplate = DEFAULT_PROMPT_TEMPLATE.replace(
				"{{input}}",
				content
			);

			const tagsResponse = await provider.callAPI(
				chatRole,
				promptTemplate,
				selectedProvider.apiKey
			);

			let tags: string[];
			try {
				const parsedResponse = JSON.parse(tagsResponse);
				if (
					!parsedResponse.output ||
					!Array.isArray(parsedResponse.output)
				) {
					throw new Error("Response is not in the correct format");
				}
				tags = parsedResponse.output.slice(0, tagCount);
			} catch (error) {
				console.error("Failed to parse tag response:", error);
				new Notice("Failed to parse tags from API response.");
				return;
			}

			const tagSetting = this.settings.frontmatter.find(
				(m) => m.name === "tags"
			);
			const tagCount = tagSetting ? tagSetting.count : 3;
			const tags = resOutput.split(",").slice(0, tagCount);
			const preprocessedTags = this.metaDataManager.preprocessTags(tags);
			await this.metaDataManager.insertToFrontMatter(
				currentFile,
				"tags",
				preprocessedTags,
				false
			);
			new Notice(
				`${preprocessedTags.length} tags added: ${preprocessedTags.join(
					", "
				)}`
			);
		} catch (error) {
			console.error(
				"Error occurred while classifying and adding tags:",
				error
			);
			new Notice("An error occurred while classifying and adding tags.");
		}
	}
}
