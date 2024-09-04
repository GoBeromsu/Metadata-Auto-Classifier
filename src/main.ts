import { Notice, Plugin } from "obsidian";
import {
	AutoClassifierSettings,
	DEFAULT_SETTINGS,
	AutoClassifierSettingTab,
} from "./settings";
import { AIFactory } from "api";
import { MetaDataManager } from "./metaDataManager";
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from "templatess";

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

		// 3. Prepare input and prompt
		const tagSetting = this.settings.frontmatter.find(
			(m) => m.name === "tags"
		);
		const tagCount = tagSetting ? tagSetting.count : 3;
		const content = await this.app.vault.read(currentFile);
		const chatRole = DEFAULT_CHAT_ROLE;
		const promptTemplate = getPromptTemplate(false, tagCount, content);

		// 4. Call API and process response
		const provider = AIFactory.getProvider(this.settings.selectedProvider);
		try {
			const responseRaw = await provider.callAPI(
				chatRole,
				promptTemplate,
				selectedProvider.apiKey
			);

			// 5. Process the response
			const { resOutput, resReliability } =
				this.processAPIResponse(responseRaw);
			if (!resOutput || resReliability === undefined) {
				return;
			}

			// 6. Check reliability
			if (resReliability <= 0.2) {
				new Notice(
					`⛔ ${this.manifest.name}: Response has low reliability (${resReliability})`
				);
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
				`✅ ${
					preprocessedTags.length
				} tags added: ${preprocessedTags.join(", ")}`
			);
		} catch (error) {
			console.error(
				"Error occurred while classifying and adding tags:",
				error
			);
			new Notice("An error occurred while classifying and adding tags.");
		}
	}

	private processAPIResponse(responseRaw: string): {
		resOutput: string | null;
		resReliability: number | undefined;
	} {
		try {
			const response = JSON.parse(responseRaw);
			return {
				resOutput: response.output.join(", "),
				resReliability: response.reliability,
			};
		} catch (error) {
			console.error("Error parsing API response:", error);
			new Notice(
				`⛔ ${this.manifest.name}: Output format error (output: ${responseRaw})`
			);
			return { resOutput: null, resReliability: undefined };
		}
	}
}
