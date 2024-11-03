import { App, TFile, getAllTags, getFrontMatterInfo } from 'obsidian';
interface FrontMatter {
	[key: string]: string[];
}
export default class FrontMatterHandler {
	private readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	// Insert or update a key-value pair in the frontmatter of a file
	async insertToFrontMatter(
		file: TFile,
		key: string,
		value: string[],
		overwrite = false
	): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (frontmatter: FrontMatter) => {
			// Function to remove spaces, except in wiki links
			const processString = (str: string) => {
				return str.replace(/(\[\[.*?\]\])|([^\[\]]+)/g, (match, wikiLink, word) => {
					if (wikiLink) return wikiLink;
					return word.replace(/\s+/g, '');
				});
			};

			// Process the value
			const processedValue = value.map(processString);

			if (frontmatter[key] && !overwrite) {
				const existingValue = frontmatter[key].map(processString);
				frontmatter[key] = [...existingValue, ...processedValue];
			} else {
				// If no existing value or overwrite is true, directly set processedValue
				frontmatter[key] = processedValue;
			}

			// Remove duplicates and empty strings
			frontmatter[key] = [...new Set(frontmatter[key])].filter(Boolean);
		});
	}

	// Get all tags from the vault
	async getAllTags(): Promise<string[]> {
		const allTags = new Set<string>();
		this.app.vault.getMarkdownFiles().forEach((file) => {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);
			if (cachedMetadata) {
				const fileTags = getAllTags(cachedMetadata);
				if (fileTags) fileTags.forEach((tag) => allTags.add(tag.slice(1))); // Remove the '#' prefix
			}
		});
		return Array.from(allTags);
	}

	// Get the markdown content of a file without the frontmatter
	async getMarkdownContentWithoutFrontmatter(file: TFile): Promise<string> {
		const content = await this.app.vault.read(file);
		const { contentStart } = getFrontMatterInfo(content);
		return content.slice(contentStart).trim();
	}
}
