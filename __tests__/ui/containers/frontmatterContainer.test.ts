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

	describe('Basic Rendering', () => {
		test('renders frontmatter templates correctly', () => {
			// Given: 3 frontmatter templates (id: 1,2,3)
			expect(mockPlugin.settings.frontmatter).toHaveLength(3);
			const templates = mockPlugin.settings.frontmatter;

			// Spy on createFrontmatterSetting
			const createSpy = jest
				.spyOn(frontmatter as any, 'createFrontmatterSetting')
				.mockImplementation(() => {});

			// When: display is called
			frontmatter.display();

			// Then: container should be emptied and each template displayed with delete button
			expect(mockContainer.empty).toHaveBeenCalled();
			expect(createSpy).toHaveBeenCalledTimes(3);
			templates.forEach((template: any) => {
				expect(createSpy).toHaveBeenCalledWith(
					expect.any(Object),
					template,
					expect.objectContaining({
						onEdit: expect.any(Function),
						onDelete: expect.any(Function),
					}),
					true // showDeleteButton = true
				);
			});
		});

		test('handles empty template array without errors', () => {
			// Given: empty frontmatter array
			mockPlugin.settings.frontmatter = [];

			// When: display is called
			frontmatter.display();

			// Then: should only empty container without errors
			expect(mockContainer.empty).toHaveBeenCalled();
		});
	});

	describe('Template Management', () => {
		test('filters templates with id=0 in display (Critical Regression)', () => {
			// Given: templates including id=0
			mockPlugin.settings.frontmatter = [makeItem(0), makeItem(1), makeItem(2)];
			const templateWithId0 = makeItem(0);

			// Spy on createFrontmatterSetting
			const createSpy = jest
				.spyOn(frontmatter as any, 'createFrontmatterSetting')
				.mockImplementation(() => {});

			// When: display is called
			frontmatter.display();

			// Then: id=0 should not be displayed (reserved for Tag)
			expect(mockContainer.empty).toHaveBeenCalled();
			// Only createFrontmatterSetting with id!=0 should be called
			expect(createSpy).toHaveBeenCalledTimes(2);
			expect(createSpy).not.toHaveBeenCalledWith(
				expect.any(Object),
				templateWithId0,
				expect.any(Object),
				expect.any(Boolean)
			);
		});

		test('deletes template and saves settings in handleDelete', async () => {
			// Given: 3 templates
			expect(mockPlugin.settings.frontmatter).toHaveLength(3);

			// When: delete first template
			await (frontmatter as any).handleDelete(makeItem(1));

			// Then: only that template should be deleted
			expect(mockPlugin.settings.frontmatter).toHaveLength(2);
			expect(mockPlugin.settings.frontmatter.find((f: any) => f.id === 1)).toBeUndefined();
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		test('edits template and re-registers command in handleEdit (Critical Regression)', async () => {
			// Given: template to edit
			const originalTemplate = makeItem(1);
			const updatedTemplate = { ...originalTemplate, name: 'Updated Template' };

			// Mock openEditModal
			(frontmatter as any).openEditModal = jest
				.fn()
				.mockImplementation((template: any, onSave: any) => onSave(updatedTemplate));

			// When: template is edited
			await (frontmatter as any).handleEdit(originalTemplate);

			// Then: command should be re-registered and settings saved
			expect(mockPlugin.registerCommand).toHaveBeenCalledWith(
				updatedTemplate.name,
				expect.any(Function)
			);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		test('displays nothing when only id=0 exists', () => {
			// Given: only id=0 template exists (reserved for Tag)
			mockPlugin.settings.frontmatter = [makeItem(0)];

			// Spy on createFrontmatterSetting
			const createSpy = jest
				.spyOn(frontmatter as any, 'createFrontmatterSetting')
				.mockImplementation(() => {});

			// When: display is called
			frontmatter.display();

			// Then: container is emptied but createFrontmatterSetting is not called
			expect(mockContainer.empty).toHaveBeenCalled();
			expect(createSpy).not.toHaveBeenCalled();
		});
	});
});
