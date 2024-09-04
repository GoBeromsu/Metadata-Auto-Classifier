import { Plugin } from "obsidian";
import { AutoClassifierSettings, DEFAULT_SETTINGS, AutoClassifierSettingTab } from "./settings";

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new AutoClassifierSettingTab(this.app, this));


	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


}
