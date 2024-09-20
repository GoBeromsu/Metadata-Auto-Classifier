import { App, TFile } from 'obsidian';
import { getFrontMatterInfo } from 'obsidian';

export class MetaDataManager {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	// Insert or update a key-value pair in the frontmatter of a file
	async insertToFrontMatter(
		file: TFile,
		key: string,
		value: string | string[],
		overwrite = false
	): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter = frontmatter || {};

			// Function to remove spaces, except in wiki links
			const processString = (str: string) => {
				return str.replace(/(\[\[.*?\]\])|([^\[\]]+)/g, (match, wikiLink, word) => {
					if (wikiLink) return wikiLink;
					return word.replace(/\s+/g, '');
				});
			};

			// Process the value
			const processedValue = Array.isArray(value) ? value.map(processString) : processString(value);

			if (frontmatter[key] && !overwrite) {
				if (Array.isArray(frontmatter[key])) {
					frontmatter[key] = [
						...frontmatter[key].map(processString),
						...(Array.isArray(processedValue) ? processedValue : [processedValue]),
					];
				} else {
					frontmatter[key] = [
						processString(frontmatter[key]),
						...(Array.isArray(processedValue) ? processedValue : [processedValue]),
					];
				}
			} else {
				frontmatter[key] = processedValue;
			}

			// Remove duplicates and empty strings
			if (Array.isArray(frontmatter[key])) {
				frontmatter[key] = [...new Set(frontmatter[key])].filter(Boolean);
			}
		});
	}

	// Get all tags from the vault
	async getAllTags(): Promise<string[]> {
		const tags = new Set<string>();
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);

			// Frontmatter tags
			const frontmatterTags = cachedMetadata?.frontmatter?.tags;
			if (Array.isArray(frontmatterTags)) {
				frontmatterTags.forEach((tag) => {
					if (typeof tag === 'string') {
						tags.add(tag.replace(/^#/, ''));
					}
				});
			}

			// Inline tags
			if (cachedMetadata?.tags) {
				cachedMetadata.tags.forEach((tag) => tags.add(tag.tag.replace(/^#/, '')));
			}
		}

		return Array.from(tags);
	}

	// Get the value of a specific key from the frontmatter of a file
	async getSavedFrontMatterValue(file: TFile, key: string): Promise<any> {
		return this.app.metadataCache.getFileCache(file)?.frontmatter?.[key];
	}

	// Get the markdown content of a file without the frontmatter
	async getMarkdownContentWithoutFrontmatter(file: TFile): Promise<string> {
		const content = await this.app.vault.read(file);
		const { contentStart } = getFrontMatterInfo(content);
		return content.slice(contentStart).trim();
	}
}
