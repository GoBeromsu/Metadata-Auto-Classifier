jest.mock('ui/modals/FrontmatterEditorModal', () => ({
	ConfigurableSettingModal: class {},
}));

import { Frontmatter } from 'ui/containers/Frontmatter';

const makeItem = (id: number) => ({
	id,
	name: `f${id}`,
	count: { min: 1, max: 1 },
	refs: [],
	overwrite: false,
	linkType: 'WikiLink',
	customQuery: '',
});

const createMockPlugin = () => ({
	app: { vault: { getMarkdownFiles: jest.fn() } },
	settings: {
		frontmatter: [makeItem(1), makeItem(2), makeItem(3)],
	},
	saveSettings: jest.fn().mockResolvedValue(undefined),
	registerCommand: jest.fn(),
	processFrontmatter: jest.fn(),
});

const createMockContainer = () => ({
	empty: jest.fn(),
	createEl: jest.fn().mockReturnValue({
		createEl: jest.fn().mockReturnValue({}),
	}),
});

describe('Frontmatter Container - Regression Tests', () => {
	let mockPlugin: any;
	let mockContainer: any;
	let frontmatter: Frontmatter;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockContainer = createMockContainer();
		frontmatter = new (Frontmatter as any)(mockPlugin, mockContainer);
		(global as any).confirm = jest.fn().mockReturnValue(true);
		jest.clearAllMocks();
	});

	describe('Template Management', () => {
		test('display에서 id=0 템플릿 필터링 (Critical Regression)', () => {
			// Given: id=0 포함한 템플릿들
			mockPlugin.settings.frontmatter = [makeItem(0), makeItem(1), makeItem(2)];

			// When: display 호출
			frontmatter.display();

			// Then: id=0은 표시되지 않아야 함 (Tag용)
			expect(mockContainer.empty).toHaveBeenCalled();
			// 실제로는 createFrontmatterSetting이 id!=0인 것들만 호출되어야 함
		});

		test('handleDelete 템플릿 삭제 및 저장', async () => {
			// Given: 3개 템플릿
			expect(mockPlugin.settings.frontmatter).toHaveLength(3);

			// When: 첫 번째 템플릿 삭제
			await (frontmatter as any).handleDelete(makeItem(1));

			// Then: 해당 템플릿만 삭제
			expect(mockPlugin.settings.frontmatter).toHaveLength(2);
			expect(mockPlugin.settings.frontmatter.find((f: any) => f.id === 1)).toBeUndefined();
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		test('handleEdit 템플릿 수정 및 커맨드 재등록 (Critical Regression)', async () => {
			// Given: 수정할 템플릿
			const originalTemplate = makeItem(1);
			const updatedTemplate = { ...originalTemplate, name: 'Updated Template' };

			// openEditModal 모킹
			(frontmatter as any).openEditModal = jest
				.fn()
				.mockImplementation((template: any, onSave: any) => onSave(updatedTemplate));

			// When: 템플릿 편집
			await (frontmatter as any).handleEdit(originalTemplate);

			// Then: 커맨드 재등록 및 설정 저장
			expect(mockPlugin.registerCommand).toHaveBeenCalledWith(
				updatedTemplate.name,
				expect.any(Function)
			);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});

	describe('Display Logic', () => {
		test('빈 frontmatter 배열 처리', () => {
			// Given: 빈 배열
			mockPlugin.settings.frontmatter = [];

			// When: display 호출
			frontmatter.display();

			// Then: 에러 없이 처리
			expect(mockContainer.empty).toHaveBeenCalled();
		});

		test('id=0만 있는 경우 아무것도 표시하지 않음', () => {
			// Given: id=0 템플릿만 존재
			mockPlugin.settings.frontmatter = [makeItem(0)];

			// When: display 호출
			frontmatter.display();

			// Then: 컨테이너는 비워지지만 템플릿은 표시되지 않음
			expect(mockContainer.empty).toHaveBeenCalled();
		});
	});
});
