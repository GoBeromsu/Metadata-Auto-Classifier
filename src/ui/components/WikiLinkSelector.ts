import type { App, TFile } from 'obsidian';
import { WikiLinkSuggestModal } from '../modals/WikiLinkSuggestModal';

/**
 * Helper class to manage wiki link selection
 */
export class WikiLinkSelector {
	readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Opens a modal to select a file from the vault as a wiki link
	 * @param callback Function to call with the selected wiki link
	 */
	openFileSelector(callback: (wikiLink: string) => void): void {
		const modal = new WikiLinkSuggestModal(this.app, (file: TFile) => {
			// Return just the filename without extension as the wiki link
			callback(file.basename);
		});
		modal.open();
	}

	/**
	 * Gets all files in the vault as potential wiki links
	 * @returns Array of filenames without extensions
	 */
	getAllPossibleWikiLinks(): string[] {
		return this.app.vault.getMarkdownFiles().map((file) => file.basename);
	}
}
