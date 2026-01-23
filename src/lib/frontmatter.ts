import type { MetadataCache, TFile } from 'obsidian';
import { getAllTags, getFrontMatterInfo, parseFrontMatterStringArray } from 'obsidian';

import type {
	FrontMatter,
	FrontmatterField,
	InsertFrontMatterParams,
	ProcessFrontMatterFn,
} from '../types';

/**
 * Extracts the content of a markdown file excluding frontmatter
 * @param content - The full content of the markdown file
 * @returns The content without frontmatter
 */
export function getContentWithoutFrontmatter(content: string): string {
	const { contentStart } = getFrontMatterInfo(content);
	return content.slice(contentStart);
}

/**
 * Collects all unique values for a specific frontmatter field from the vault.
 *
 * @param fieldName - The name of the frontmatter field to collect values for (for example, "tags").
 * @param files - The list of files to scan for the specified frontmatter field.
 * @param metadataCache - The Obsidian metadata cache used to access frontmatter and tags.
 * @returns An array of unique string values found for the specified field across all files.
 */
export function getFieldValues(
	fieldName: string,
	files: ReadonlyArray<TFile>,
	metadataCache: MetadataCache
): string[] {
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
}

/**
 * Gets a frontmatter setting by ID from the settings array.
 */
export function getFrontmatterSetting(
	id: number,
	settings: FrontmatterField[]
): FrontmatterField {
	const setting = settings?.find((f) => f.id === id);
	if (!setting) {
		throw new Error('Setting not found');
	}
	return setting;
}

/**
 * Inserts values into frontmatter with optional WikiLink formatting.
 */
export async function insertToFrontMatter(
	processFrontMatter: ProcessFrontMatterFn,
	params: InsertFrontMatterParams
): Promise<void> {
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
}

/**
 * Creates a deep copy of a FrontmatterField to prevent input mutation.
 * Used when editing frontmatter settings in modals.
 */
export function deepCloneFrontmatterField(field: FrontmatterField): FrontmatterField {
	return {
		id: field.id,
		name: field.name,
		count: { min: field.count.min, max: field.count.max },
		refs: [...field.refs],
		overwrite: field.overwrite,
		linkType: field.linkType,
		customQuery: field.customQuery,
	};
}
