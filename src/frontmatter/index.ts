import { getAllTags, getFrontMatterInfo, MetadataCache, TFile } from 'obsidian';

import { generateId } from 'utils';
import { DEFAULT_FRONTMATTER_SETTING } from 'utils/constant';
import {
	FrontMatter,
	FrontmatterTemplate,
	InsertFrontMatterParams,
	ProcessFrontMatterFn,
} from 'utils/interface';
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
		if (!cache) return tags;

		const fileTags: string[] | null = getAllTags(cache);

		if (fileTags && fileTags.length > 0) {
			fileTags.forEach((tag) => tags.add(tag.replace('#', '')));
		}

		return tags;
	}, new Set<string>());
	return [...allTags];
};

// Moved from BaseSettingsComponent
export const getFrontmatterSetting = (
	id: number,
	settings: FrontmatterTemplate[]
): FrontmatterTemplate => {
	const setting = settings?.find((f) => f.id === id);
	if (!setting) {
		throw new Error('Setting not found');
	}
	return setting;
};

export const addFrontmatterSetting = (): FrontmatterTemplate => {
	return {
		...DEFAULT_FRONTMATTER_SETTING,
		id: generateId(),
	};
};

export const insertToFrontMatter = async (
	processFrontMatter: ProcessFrontMatterFn,
	params: InsertFrontMatterParams
): Promise<void> => {
	await processFrontMatter(params.file, (frontmatter: FrontMatter) => {
		const processedValue = params.value.map(processString);
		const frontmatterKey = params.overwrite
			? processedValue
			: [...frontmatter[params.key].map(processString), ...processedValue];
		console.log('frontmatterKey', frontmatterKey, params.overwrite);
		// Remove duplicates and empty strings
		frontmatter[params.key] = [...new Set(frontmatterKey)].filter(Boolean);
	});
};
