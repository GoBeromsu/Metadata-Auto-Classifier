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

	describe('Tag Setting Management', () => {
		test('handleEdit id=0 템플릿 업데이트 (Critical Regression)', async () => {
			// Given: DEFAULT_TAG_SETTING (id=0)
			const updatedSetting = { ...DEFAULT_TAG_SETTING, name: 'Updated Tag Name' };

			// openEditModal 모킹
			(tag as any).openEditModal = jest
				.fn()
				.mockImplementation((_: any, onSave: (s: any) => Promise<void>) => onSave(updatedSetting));

			// When: tag 설정 편집
			await (tag as any).handleEdit(DEFAULT_TAG_SETTING);

			// Then: id=0 템플릿이 업데이트되어야 함
			expect(mockPlugin.settings.frontmatter[0].name).toBe('Updated Tag Name');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		test('display DEFAULT_TAG_SETTING 표시', () => {
			// Given: tag 인스턴스
			const createFrontmatterSettingSpy = jest
				.spyOn(tag as any, 'createFrontmatterSetting')
				.mockImplementation(() => {});

			// When: display 호출
			tag.display();

			// Then: DEFAULT_TAG_SETTING이 표시되어야 함 (삭제 버튼 없이)
			expect(createFrontmatterSettingSpy).toHaveBeenCalledWith(
				expect.any(Object),
				DEFAULT_TAG_SETTING,
				expect.objectContaining({
					onEdit: expect.any(Function),
					onDelete: expect.any(Function),
				}),
				false // showDeleteButton = false
			);
		});

		test('id=0 찾기 실패시 에러 없이 처리', async () => {
			// Given: frontmatter 배열에 id=0이 없는 상황
			mockPlugin.settings.frontmatter = [{ id: 1, name: 'other' }];
			const updatedSetting = { ...DEFAULT_TAG_SETTING, name: 'Updated' };

			(tag as any).openEditModal = jest
				.fn()
				.mockImplementation((_: any, onSave: (s: any) => Promise<void>) => onSave(updatedSetting));

			// When: handleEdit 호출
			await (tag as any).handleEdit(DEFAULT_TAG_SETTING);

			// Then: 에러 없이 처리되어야 함
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});
});
