import { App, FuzzyMatch, FuzzySuggestModal, TFile } from 'obsidian';

/**
 * Modal for searching and selecting wiki links from existing files in the vault
 */
export class WikiLinkSuggestModal extends FuzzySuggestModal<TFile> {
	private onItemSelected: (file: TFile) => void;

	constructor(app: App, onItemSelected: (file: TFile) => void) {
		super(app);
		this.onItemSelected = onItemSelected;
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(file: TFile): string {
		return file.basename;
	}

	renderSuggestion(file: FuzzyMatch<TFile>, el: HTMLElement): void {
		el.createEl('div', { text: file.item.basename });
		el.createEl('small', { text: file.item.path });
	}

	onChooseItem(file: TFile): void {
		this.onItemSelected(file);
	}
}

/**
 * Helper class to manage wiki link selection
 */
export class WikiLinkSelector {
	private app: App;

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
