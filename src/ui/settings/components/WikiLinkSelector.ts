import type { App, TFile } from 'obsidian';
import { WikiLinkSuggestModal } from '../modals/WikiLinkSuggestModal';

/**
 * Helper class to manage wiki link selection
 * Pure UI component without direct Obsidian App dependency
 */
export class WikiLinkSelector {
	constructor(private readonly app: App) {}

	/**
	 * Opens a modal to select a file from the current files as a wiki link
	 * @param callback Function to call with the selected wiki link
	 */
	openFileSelector(callback: (wikiLink: string) => void): void {
		const modal = new WikiLinkSuggestModal(this.app, (file: TFile) => {
			callback(file.basename);
		});
		modal.open();
	}
}
