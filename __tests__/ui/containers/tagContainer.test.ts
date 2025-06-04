jest.mock('ui/modals/FrontmatterEditorModal', () => ({
	ConfigurableSettingModal: class {},
}));

import { Tag } from 'ui/containers/Tag';
import { DEFAULT_TAG_SETTING } from 'utils/constants';

const createMockPlugin = () => ({
	app: { vault: { getMarkdownFiles: jest.fn() } },
	settings: {
		frontmatter: [{ ...DEFAULT_TAG_SETTING }],
	},
	saveSettings: jest.fn().mockResolvedValue(undefined),
});

const createMockContainer = () => ({
	empty: jest.fn(),
	createEl: jest.fn().mockReturnValue({
		createEl: jest.fn().mockReturnValue({}),
	}),
});

describe('Tag Container - Regression Tests', () => {
	let mockPlugin: any;
	let mockContainer: any;
	let tag: Tag;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockContainer = createMockContainer();
		tag = new (Tag as any)(mockPlugin, mockContainer);
		jest.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		test('renders DEFAULT_TAG_SETTING without delete button', () => {
			// Spy on createFrontmatterSetting
			const createSpy = jest
				.spyOn(tag as any, 'createFrontmatterSetting')
				.mockImplementation(() => {});

			// When: display is called
			tag.display();

			// Then: DEFAULT_TAG_SETTING should be displayed without delete button
			expect(createSpy).toHaveBeenCalledWith(
				expect.any(Object),
				DEFAULT_TAG_SETTING,
				expect.objectContaining({
					onEdit: expect.any(Function),
					onDelete: expect.any(Function),
				}),
				false // showDeleteButton = false (important!)
			);
		});
	});

	describe('Tag Setting Management', () => {
		test('updates id=0 template in handleEdit (Critical Regression)', async () => {
			// Given: DEFAULT_TAG_SETTING (id=0)
			const updatedSetting = { ...DEFAULT_TAG_SETTING, name: 'Updated Tag Name' };

			// Mock openEditModal
			(tag as any).openEditModal = jest
				.fn()
				.mockImplementation((_: any, onSave: (s: any) => Promise<void>) => onSave(updatedSetting));

			// When: tag setting is edited
			await (tag as any).handleEdit(DEFAULT_TAG_SETTING);

			// Then: id=0 template should be updated
			expect(mockPlugin.settings.frontmatter[0].name).toBe('Updated Tag Name');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		test('handles id=0 not found without errors', async () => {
			// Given: frontmatter array without id=0
			mockPlugin.settings.frontmatter = [{ id: 1, name: 'other' }];
			const updatedSetting = { ...DEFAULT_TAG_SETTING, name: 'Updated' };

			(tag as any).openEditModal = jest
				.fn()
				.mockImplementation((_: any, onSave: (s: any) => Promise<void>) => onSave(updatedSetting));

			// When: handleEdit is called
			await (tag as any).handleEdit(DEFAULT_TAG_SETTING);

			// Then: should handle without errors
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});
});
