import { getFrontMatterInfo, MetadataCache, TFile } from 'obsidian';

/**
 * Processes a string by removing spaces except in wiki links
 * @param str String to process
 * @returns Processed string with spaces removed except in wiki links
 */
export const processString = (str: string): string => {
	return str.replace(/(\[\[.*?\]\])|([^\[\]]+)/g, (fullMatch, wikiLinkMatch, regularTextMatch) => {
		if (wikiLinkMatch) {
			return wikiLinkMatch;
		}
		return regularTextMatch.replace(/\s+/g, '');
	});
};

/**
 * Extracts the content of a markdown file excluding frontmatter
 * @param content - The full content of the markdown file
 * @returns The content without frontmatter
 */
export const getContentWithoutFrontmatter = (content: string): string => {
	const { contentStart } = getFrontMatterInfo(content);
	return content.slice(contentStart);
};

// Get all tags from the vault
export const getTags = async (
	files: ReadonlyArray<TFile>,
	metadataCache: MetadataCache
): Promise<string[]> => {
	const allTags = files.reduce((tags, file) => {
		const cache = metadataCache.getFileCache(file);
		cache?.frontmatter?.tags?.forEach((tag: string) => tags.add(tag));
		return tags;
	}, new Set<string>());
	return [...allTags];
};
