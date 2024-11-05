import { MetadataCache, TFile } from 'obsidian';

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
