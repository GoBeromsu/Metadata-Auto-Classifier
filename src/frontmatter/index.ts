import type { MetadataCache, TFile } from 'obsidian';
import { getAllTags, getFrontMatterInfo, parseFrontMatterStringArray } from 'obsidian';

import type {
	FrontMatter,
	FrontmatterField,
	InsertFrontMatterParams,
	ProcessFrontMatterFn,
} from './types';

/**
 * Extracts the content of a markdown file excluding frontmatter
 * @param content - The full content of the markdown file
 * @returns The content without frontmatter
 */
export const getContentWithoutFrontmatter = (content: string): string => {
	const { contentStart } = getFrontMatterInfo(content);
	return content.slice(contentStart);
};

// Collect all values for a specific frontmatter field from the vault
export const getFieldValues = (
	fieldName: string,
	files: ReadonlyArray<TFile>,
	metadataCache: MetadataCache
): string[] => {
	const values = new Set<string>();

	for (const file of files) {
		const cache = metadataCache.getFileCache(file);
		if (!cache) continue;

		if (fieldName === 'tags') {
			// tags requires getAllTags() to include inline tags (#tag in content)
			// parseFrontMatterStringArray would only get frontmatter tags
			getAllTags(cache)?.forEach((tag) => values.add(tag));
		} else {
			// Delegate to Obsidian API - handles both single values and arrays
			parseFrontMatterStringArray(cache.frontmatter, fieldName)?.forEach((v) => values.add(v));
		}
	}

	return [...values];
};

// Moved from BaseSettingsComponent
export const getFrontmatterSetting = (
	id: number,
	settings: FrontmatterField[]
): FrontmatterField => {
	const setting = settings?.find((f) => f.id === id);
	if (!setting) {
		throw new Error('Setting not found');
	}
	return setting;
};

export const insertToFrontMatter = async (
	processFrontMatter: ProcessFrontMatterFn,
	params: InsertFrontMatterParams
): Promise<void> => {
	await processFrontMatter(params.file, (frontmatter: FrontMatter) => {
		// Ensure values are in raw format for processing (API context)
		const rawValues =
			params.linkType === 'WikiLink' ? params.value.map((item) => `[[${item}]]`) : params.value;

		const existingRawValues = frontmatter[params.name] || [];
		// Combine values based on overwrite setting
		let combinedRawValues = params.overwrite ? rawValues : [...existingRawValues, ...rawValues];

		// Remove duplicates and empty strings
		combinedRawValues = [...new Set(combinedRawValues)].filter(Boolean);

		// Format back for storage context
		frontmatter[params.name] = combinedRawValues;
	});
};
