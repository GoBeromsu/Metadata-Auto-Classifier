import {
	getContentWithoutFrontmatter,
	getFieldValues,
	getFrontmatterSetting,
	insertToFrontMatter,
} from 'lib/frontmatter';
import type { FrontmatterField, InsertFrontMatterParams } from 'types';
import { getAllTags, getFrontMatterInfo, parseFrontMatterStringArray, MetadataCache, createMockTFile } from 'obsidian';

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
	];

	test('returns correct setting when ID exists', () => {
		expect(getFrontmatterSetting(1, mockSettings)).toEqual(mockSettings[0]);
	});

	test('throws error when setting not found', () => {
		expect(() => getFrontmatterSetting(999, mockSettings)).toThrow('Setting not found');
	});
});

// -------------------- getFieldValues Tests --------------------
describe('getFieldValues', () => {
	let metadataCache: MetadataCache;
	let file1: ReturnType<typeof createMockTFile>;
	let file2: ReturnType<typeof createMockTFile>;
	let file3: ReturnType<typeof createMockTFile>;

	beforeEach(() => {
		jest.clearAllMocks();
		metadataCache = new MetadataCache();
		file1 = createMockTFile('note1.md', 'note1');
		file2 = createMockTFile('note2.md', 'note2');
		file3 = createMockTFile('note3.md', 'note3');
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

		const result = getFieldValues('category', [file1, file2, file3] as any, metadataCache as any);

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

		const result = getFieldValues('tags', [file1, file2] as any, metadataCache as any);

		expect(getAllTags).toHaveBeenCalledTimes(2);
		expect(parseFrontMatterStringArray).not.toHaveBeenCalled();
		expect(result.length).toBeGreaterThan(0);
	});

	test('skips files with no cache', () => {
		metadataCache.setFileCache(file1, {
			frontmatter: { category: 'tech' },
		});
		// file2 has no cache

		const result = getFieldValues('category', [file1, file2] as any, metadataCache as any);

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

		const result = getFieldValues('category', [file1, file2] as any, metadataCache as any);

		expect(result).toEqual(['tech']);
	});
});

// -------------------- insertToFrontMatter Tests --------------------
describe('insertToFrontMatter', () => {
	let mockProcessFrontMatter: jest.Mock;
	let mockFile: ReturnType<typeof createMockTFile>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockProcessFrontMatter = jest.fn((file, callback) => {
			const frontmatter = {};
			callback(frontmatter);
			return Promise.resolve();
		});
		mockFile = createMockTFile('test.md', 'test');
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
});
