import {
	getContentWithoutFrontmatter,
	getFieldValues,
	getFrontmatterSetting,
	insertToFrontMatter,
} from 'frontmatter';
import type { FrontmatterField, InsertFrontMatterParams } from 'frontmatter/types';
import { getAllTags, getFrontMatterInfo, MetadataCache, parseFrontMatterStringArray, TFile } from 'obsidian';

// -------------------- getContentWithoutFrontmatter Tests --------------------
describe('getContentWithoutFrontmatter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('removes frontmatter from content with frontmatter', () => {
		const content = `---
title: Test Note
tags: [test, example]
---
This is the actual content.`;

		const result = getContentWithoutFrontmatter(content);
		expect(result).toBe('This is the actual content.');
		expect(getFrontMatterInfo).toHaveBeenCalledWith(content);
	});

	test('returns full content when no frontmatter exists', () => {
		const content = 'This is content without frontmatter.';
		const result = getContentWithoutFrontmatter(content);
		expect(result).toBe('This is content without frontmatter.');
		expect(getFrontMatterInfo).toHaveBeenCalledWith(content);
	});

	test('handles empty content', () => {
		const content = '';
		const result = getContentWithoutFrontmatter(content);
		expect(result).toBe('');
		expect(getFrontMatterInfo).toHaveBeenCalledWith(content);
	});

	test('handles content with only frontmatter', () => {
		const content = `---
title: Only Frontmatter
---
`;
		const result = getContentWithoutFrontmatter(content);
		expect(result).toBe('');
		expect(getFrontMatterInfo).toHaveBeenCalledWith(content);
	});

	test('handles multiline content after frontmatter', () => {
		const content = `---
title: Test
---
Line 1
Line 2
Line 3`;
		const result = getContentWithoutFrontmatter(content);
		expect(result).toBe('Line 1\nLine 2\nLine 3');
	});
});

// -------------------- getFrontmatterSetting Tests --------------------
describe('getFrontmatterSetting', () => {
	const mockSettings: FrontmatterField[] = [
		{
			id: 1,
			name: 'tags',
			count: { min: 1, max: 5 },
			refs: ['#tag1', '#tag2'],
			overwrite: false,
			linkType: 'Normal',
			customQuery: '',
		},
		{
			id: 2,
			name: 'category',
			count: { min: 1, max: 1 },
			refs: ['cat1', 'cat2'],
			overwrite: true,
			linkType: 'WikiLink',
			customQuery: 'custom query text',
		},
		{
			id: 3,
			name: 'author',
			count: { min: 1, max: 3 },
			refs: [],
			overwrite: false,
			linkType: 'Normal',
			customQuery: '',
		},
	];

	test('returns correct setting when ID exists', () => {
		const result = getFrontmatterSetting(2, mockSettings);
		expect(result).toEqual(mockSettings[1]);
		expect(result.name).toBe('category');
		expect(result.overwrite).toBe(true);
	});

	test('returns first setting for ID 1', () => {
		const result = getFrontmatterSetting(1, mockSettings);
		expect(result).toEqual(mockSettings[0]);
		expect(result.name).toBe('tags');
	});

	test('returns last setting for ID 3', () => {
		const result = getFrontmatterSetting(3, mockSettings);
		expect(result).toEqual(mockSettings[2]);
		expect(result.name).toBe('author');
	});

	test('throws error when ID does not exist', () => {
		expect(() => getFrontmatterSetting(999, mockSettings)).toThrow('Setting not found');
	});

	test('throws error when settings array is empty', () => {
		expect(() => getFrontmatterSetting(1, [])).toThrow('Setting not found');
	});

	test('throws error when settings is undefined', () => {
		expect(() => getFrontmatterSetting(1, undefined as any)).toThrow('Setting not found');
	});

	test('throws error when settings is null', () => {
		expect(() => getFrontmatterSetting(1, null as any)).toThrow('Setting not found');
	});

	test('returns setting with all field properties intact', () => {
		const result = getFrontmatterSetting(2, mockSettings);
		expect(result).toHaveProperty('id');
		expect(result).toHaveProperty('name');
		expect(result).toHaveProperty('count');
		expect(result).toHaveProperty('refs');
		expect(result).toHaveProperty('overwrite');
		expect(result).toHaveProperty('linkType');
		expect(result).toHaveProperty('customQuery');
	});
});

// -------------------- getFieldValues Tests --------------------
describe('getFieldValues', () => {
	let metadataCache: MetadataCache;
	let file1: TFile;
	let file2: TFile;
	let file3: TFile;

	beforeEach(() => {
		jest.clearAllMocks();
		metadataCache = new MetadataCache();
		file1 = new TFile('note1.md', 'note1');
		file2 = new TFile('note2.md', 'note2');
		file3 = new TFile('note3.md', 'note3');
	});

	test('collects unique values for regular frontmatter field', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { category: ['tech', 'programming'] },
		});
		metadataCache.setFileCache(file2, {
			frontmatter: { category: ['tech', 'design'] },
		});
		metadataCache.setFileCache(file3, {
			frontmatter: { category: 'programming' },
		});

		const result = getFieldValues('category', [file1, file2, file3], metadataCache);

		expect(parseFrontMatterStringArray).toHaveBeenCalledTimes(3);
		expect(result).toEqual(expect.arrayContaining(['tech', 'programming', 'design']));
		expect(result).toHaveLength(3);
	});

	test('handles tags field using getAllTags', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { tags: ['#tag1', '#tag2'] },
			tags: [{ tag: '#tag3' }],
		});
		metadataCache.setFileCache(file2, {
			frontmatter: { tags: '#tag2' },
			tags: [{ tag: '#tag4' }],
		});

		const result = getFieldValues('tags', [file1, file2], metadataCache);

		expect(getAllTags).toHaveBeenCalledTimes(2);
		expect(parseFrontMatterStringArray).not.toHaveBeenCalled();
		expect(result.length).toBeGreaterThan(0);
	});

	test('returns empty array when no files provided', () => {
		const result = getFieldValues('category', [], metadataCache);
		expect(result).toEqual([]);
	});

	test('skips files with no cache', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { category: 'tech' },
		});
		// file2 has no cache

		const result = getFieldValues('category', [file1, file2], metadataCache);

		expect(metadataCache.getFileCache).toHaveBeenCalledTimes(2);
		expect(result).toEqual(['tech']);
	});

	test('skips files without the specified field', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { category: 'tech' },
		});
		metadataCache.setFileCache(file2, {
			frontmatter: { other: 'value' },
		});

		const result = getFieldValues('category', [file1, file2], metadataCache);

		expect(result).toEqual(['tech']);
	});

	test('removes duplicate values across files', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { status: 'active' },
		});
		metadataCache.setFileCache(file2, {
			frontmatter: { status: 'active' },
		});
		metadataCache.setFileCache(file3, {
			frontmatter: { status: 'active' },
		});

		const result = getFieldValues('status', [file1, file2, file3], metadataCache);

		expect(result).toEqual(['active']);
		expect(result).toHaveLength(1);
	});

	test('handles single value and array values correctly', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { author: 'John' },
		});
		metadataCache.setFileCache(file2, {
			frontmatter: { author: ['Jane', 'Bob'] },
		});

		const result = getFieldValues('author', [file1, file2], metadataCache);

		expect(result).toEqual(expect.arrayContaining(['John', 'Jane', 'Bob']));
		expect(result).toHaveLength(3);
	});

	test('handles empty frontmatter', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: {},
		});

		const result = getFieldValues('category', [file1], metadataCache);

		expect(result).toEqual([]);
	});

	test('maintains unique values with Set behavior', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { labels: ['important', 'review', 'important'] },
		});

		const result = getFieldValues('labels', [file1], metadataCache);

		// Set should deduplicate values
		expect(result).toEqual(expect.arrayContaining(['important', 'review']));
		expect(result).toHaveLength(2);
	});
});

// -------------------- insertToFrontMatter Tests --------------------
describe('insertToFrontMatter', () => {
	let mockProcessFrontMatter: jest.Mock;
	let mockFile: TFile;

	beforeEach(() => {
		jest.clearAllMocks();
		mockProcessFrontMatter = jest.fn((file, callback) => {
			const frontmatter = {};
			callback(frontmatter);
			return Promise.resolve();
		});
		mockFile = new TFile('test.md', 'test');
	});

	test('inserts values with Normal link type', async () => {
		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: ['tag1', 'tag2'],
			overwrite: false,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		expect(mockProcessFrontMatter).toHaveBeenCalledWith(mockFile, expect.any(Function));

		// Verify the callback modifies frontmatter correctly
		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = {};
		callbackFn(testFrontmatter);

		expect(testFrontmatter.tags).toEqual(['tag1', 'tag2']);
	});

	test('inserts values with WikiLink format', async () => {
		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'references',
			value: ['Page1', 'Page2'],
			overwrite: false,
			linkType: 'WikiLink',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = {};
		callbackFn(testFrontmatter);

		expect(testFrontmatter.references).toEqual(['[[Page1]]', '[[Page2]]']);
	});

	test('overwrites existing values when overwrite is true', async () => {
		mockProcessFrontMatter = jest.fn((file, callback) => {
			const frontmatter = { tags: ['old1', 'old2'] };
			callback(frontmatter);
			return Promise.resolve();
		});

		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: ['new1', 'new2'],
			overwrite: true,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = { tags: ['old1', 'old2'] };
		callbackFn(testFrontmatter);

		expect(testFrontmatter.tags).toEqual(['new1', 'new2']);
		expect(testFrontmatter.tags).not.toContain('old1');
	});

	test('appends values when overwrite is false', async () => {
		mockProcessFrontMatter = jest.fn((file, callback) => {
			const frontmatter = { tags: ['existing'] };
			callback(frontmatter);
			return Promise.resolve();
		});

		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: ['new'],
			overwrite: false,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = { tags: ['existing'] };
		callbackFn(testFrontmatter);

		expect(testFrontmatter.tags).toEqual(['existing', 'new']);
	});

	test('removes duplicate values', async () => {
		mockProcessFrontMatter = jest.fn((file, callback) => {
			const frontmatter = { tags: ['tag1', 'tag2'] };
			callback(frontmatter);
			return Promise.resolve();
		});

		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: ['tag2', 'tag3'],
			overwrite: false,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = { tags: ['tag1', 'tag2'] };
		callbackFn(testFrontmatter);

		expect(testFrontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
		expect(testFrontmatter.tags).toHaveLength(3);
	});

	test('filters out empty strings', async () => {
		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: ['tag1', '', 'tag2', ''],
			overwrite: false,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = {};
		callbackFn(testFrontmatter);

		expect(testFrontmatter.tags).toEqual(['tag1', 'tag2']);
		expect(testFrontmatter.tags).not.toContain('');
	});

	test('creates new field if it does not exist', async () => {
		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'newfield',
			value: ['value1', 'value2'],
			overwrite: false,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = {};
		callbackFn(testFrontmatter);

		expect(testFrontmatter.newfield).toEqual(['value1', 'value2']);
	});

	test('handles WikiLink with overwrite and deduplication', async () => {
		mockProcessFrontMatter = jest.fn((file, callback) => {
			const frontmatter = { refs: ['[[Page1]]', '[[Page2]]'] };
			callback(frontmatter);
			return Promise.resolve();
		});

		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'refs',
			value: ['Page2', 'Page3'],
			overwrite: false,
			linkType: 'WikiLink',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = { refs: ['[[Page1]]', '[[Page2]]'] };
		callbackFn(testFrontmatter);

		expect(testFrontmatter.refs).toEqual(['[[Page1]]', '[[Page2]]', '[[Page3]]']);
	});

	test('returns Promise that resolves', async () => {
		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: ['tag1'],
			overwrite: false,
			linkType: 'Normal',
		};

		const result = insertToFrontMatter(mockProcessFrontMatter, params);

		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBeUndefined();
	});

	test('handles empty value array', async () => {
		const params: InsertFrontMatterParams = {
			file: mockFile,
			name: 'tags',
			value: [],
			overwrite: false,
			linkType: 'Normal',
		};

		await insertToFrontMatter(mockProcessFrontMatter, params);

		const callbackFn = mockProcessFrontMatter.mock.calls[0][1];
		const testFrontmatter: any = {};
		callbackFn(testFrontmatter);

		expect(testFrontmatter.tags).toEqual([]);
	});
});
