import { Notice, Plugin } from "obsidian";
import {
	AutoClassifierSettings,
	DEFAULT_SETTINGS,
	AutoClassifierSettingTab,
} from "./settings";
import { AIFactory } from "api";

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "fetch-tags",
			name: "Fetch tags using current provider",
			callback: async () => {
				await this.fetchAndDisplayTags();
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

	async fetchAndDisplayTags() {
		try {
			const currentProvider = this.settings.selectedProvider;
			const provider = AIFactory.getProvider(currentProvider);
			const selectedProvider = this.settings.apiProviders.find(
				(p) => p.name === currentProvider
			);

			if (!selectedProvider || !selectedProvider.apiKey) {
				new Notice(
					"API key is not set for the selected provider. Please set it in the plugin settings."
				);
				return;
			}

			const tagSetting = this.settings.frontmatter.find(
				(m) => m.name === "tag"
			);
			const tagCount = tagSetting ? tagSetting.count : 3;

			const tagsResponse = await provider.callAPI(
				"You are a tag retrieval system. Return only a JSON array of tags.",
				`Retrieve ${tagCount} most relevant tags for this system.`,
				selectedProvider.apiKey
			);

			let tags: string[];
			try {
				tags = JSON.parse(tagsResponse);
				if (!Array.isArray(tags)) {
					throw new Error("Response is not an array");
				}
				tags = tags.slice(0, tagCount);
			} catch (error) {
				console.error("Failed to parse tags response:", error);
				new Notice("Failed to parse tags from the API response.");
				return;
			}

			console.log("Fetched tags:", tags);
			new Notice(
				`Successfully fetched ${tags.length} tags. Check console for details.`
			);
		} catch (error) {
			console.error("Error fetching tags:", error);
			new Notice(
				"Failed to fetch tags. Check console for error details."
			);
		}
	}
}
