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
 * Wraps the string in wiki link format if linkType is WikiLink
 * @param str String to process
 * @param linkType Link type ('Normal' or 'WikiLink')
 * @returns String wrapped in [[]] if linkType is WikiLink, otherwise returns the original string
 */
export const formatStringByLinkType = (str: string, linkType?: 'Normal' | 'WikiLink'): string => {
	if (linkType === 'WikiLink' && !str.startsWith('[[') && !str.endsWith(']]')) {
		return `[[${str}]]`;
	}
	return str;
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

export const addFrontmatterSetting = (
	linkType: 'Normal' | 'WikiLink' = 'Normal'
): FrontmatterTemplate => {
	return {
		...DEFAULT_FRONTMATTER_SETTING,
		id: generateId(),
		linkType,
	};
};

export const insertToFrontMatter = async (
	processFrontMatter: ProcessFrontMatterFn,
	params: InsertFrontMatterParams
): Promise<void> => {
	await processFrontMatter(params.file, (frontmatter: FrontMatter) => {
		// Process values based on linkType
		const processedValue = params.value;
		const existingValues = frontmatter[params.key] || [];

		// Combine values based on overwrite setting
		let combinedValues = params.overwrite ? processedValue : [...existingValues, ...processedValue];

		// Remove duplicates and empty strings
		combinedValues = [...new Set(combinedValues)].filter(Boolean);

		// Format back to Wiki links if needed
		frontmatter[params.key] = combinedValues.map((item) =>
			formatStringByLinkType(item, params.linkType)
		);
	});
};
