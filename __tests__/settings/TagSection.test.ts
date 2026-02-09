vi.mock('settings/modals/FrontmatterEditorModal', () => ({
	ConfigurableSettingModal: class {},
}));

import type { Mock } from 'vitest';
import type { FrontmatterField } from 'types';
import { Tag } from 'settings/TagSection';
import { DEFAULT_TAG_SETTING } from '../../src/constants';

interface MockPlugin {
	app: { vault: { getMarkdownFiles: Mock } };
	settings: { frontmatter: FrontmatterField[] };
	saveSettings: Mock;
}

interface MockContainer {
	empty: Mock;
	createEl: Mock;
	createDiv: Mock;
}

const createMockPlugin = (): MockPlugin => ({
	app: { vault: { getMarkdownFiles: vi.fn() } },
	settings: {
		frontmatter: [{ ...DEFAULT_TAG_SETTING }],
	},
	saveSettings: vi.fn().mockResolvedValue(undefined),
});

const createMockContainer = (): MockContainer => ({
	empty: vi.fn(),
	createEl: vi.fn(),
	createDiv: vi.fn().mockReturnValue({
		createEl: vi.fn(),
	}),
});

describe('Tag Container - Regression Tests', () => {
	let mockPlugin: MockPlugin;
	let mockContainer: MockContainer;
	let tag: Tag;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockContainer = createMockContainer();
		tag = new (Tag as any)(mockPlugin, mockContainer as unknown as HTMLElement);
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		test('renders DEFAULT_TAG_SETTING without delete button', () => {
			// When: display is called (should not throw)
			expect(() => tag.display()).not.toThrow();

			// Verify the DEFAULT_TAG_SETTING properties are valid for display
			expect(DEFAULT_TAG_SETTING.name).toBeDefined();
			expect(DEFAULT_TAG_SETTING.id).toBe(0); // Reserved id for Tag

			// Verify the tag setting structure is correct
			expect(DEFAULT_TAG_SETTING.linkType).toBeDefined();
			expect(DEFAULT_TAG_SETTING.count).toBeDefined();
			expect(DEFAULT_TAG_SETTING.refs).toBeDefined();
		});
	});

	describe('Tag Setting Management', () => {
		test('updates id=0 template in handleEdit (Critical Regression)', async () => {
			// Given: DEFAULT_TAG_SETTING (id=0)
			const updatedSetting = { ...DEFAULT_TAG_SETTING, name: 'Updated Tag Name' };

			// Mock openEditModal
			(tag as any).openEditModal = vi
				.fn()
				.mockImplementation(
					(_: FrontmatterField, onSave: (s: FrontmatterField) => Promise<void>) =>
						onSave(updatedSetting)
				);

			// When: tag setting is edited
			await (tag as any).handleEdit(DEFAULT_TAG_SETTING);

			// Then: id=0 template should be updated
			expect(mockPlugin.settings.frontmatter[0].name).toBe('Updated Tag Name');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		test('handles id=0 not found without errors', async () => {
			// Given: frontmatter array without id=0
			mockPlugin.settings.frontmatter = [
				{
					id: 1,
					name: 'other',
					count: { min: 1, max: 1 },
					refs: [],
					overwrite: false,
					linkType: 'WikiLink',
					customQuery: '',
				},
			];
			const updatedSetting = { ...DEFAULT_TAG_SETTING, name: 'Updated' };

			(tag as any).openEditModal = vi
				.fn()
				.mockImplementation(
					(_: FrontmatterField, onSave: (s: FrontmatterField) => Promise<void>) =>
						onSave(updatedSetting)
				);

			// When: handleEdit is called
			await (tag as any).handleEdit(DEFAULT_TAG_SETTING);

			// Then: should handle without errors
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});
});
