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
				// Split the string into wiki links [[...]] and regular text
				// First capture group: (\[\[.*?\]\]) matches wiki links like [[Some Link]]
				// Second capture group: ([^\[\]]+) matches any text that's not inside brackets
				return str.replace(/(\[\[.*?\]\])|([^\[\]]+)/g, (fullMatch, wikiLinkMatch, regularTextMatch) => {
					// Preserve wiki links exactly as they are
					if (wikiLinkMatch) {
						return wikiLinkMatch;
					}
					// Remove all whitespace from regular text
					return regularTextMatch.replace(/\s+/g, '');
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
