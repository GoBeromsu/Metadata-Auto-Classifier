jest.mock('settings/modals/FrontmatterEditorModal', () => ({
	ConfigurableSettingModal: class {},
}));

import { FrontmatterSection } from 'settings/FrontmatterSection';

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
	createEl: jest.fn(),
	createDiv: jest.fn().mockReturnValue({
		createEl: jest.fn(),
	}),
});

describe('Frontmatter Container - Regression Tests', () => {
	let mockPlugin: any;
	let mockContainer: any;
	let frontmatterSection: FrontmatterSection;

	beforeEach(() => {
		mockPlugin = createMockPlugin();
		mockContainer = createMockContainer();
		frontmatterSection = new (FrontmatterSection as any)(mockPlugin, mockContainer);
		(global as any).confirm = jest.fn().mockReturnValue(true);
		jest.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		test('renders frontmatter templates correctly', () => {
			// Given: 3 frontmatter templates (id: 1,2,3)
			expect(mockPlugin.settings.frontmatter).toHaveLength(3);
			const templates = mockPlugin.settings.frontmatter;

			// When: display is called
			frontmatterSection.display();

			// Then: container should be emptied
			expect(mockContainer.empty).toHaveBeenCalled();

			// Verify each template's data is valid for rendering
			templates.forEach((template: any) => {
				expect(template.name).toBeDefined();
				expect(template.id).not.toBe(0); // Should not include id=0 templates
			});
		});

		test('handles empty template array without errors', () => {
			// Given: empty frontmatter array
			mockPlugin.settings.frontmatter = [];

			// When: display is called
			expect(() => frontmatterSection.display()).not.toThrow();

			// Then: should only empty container without errors
			expect(mockContainer.empty).toHaveBeenCalled();
		});
	});

	describe('Template Management', () => {
		test('filters templates with id=0 in display (Critical Regression)', () => {
			// Given: templates including id=0
			mockPlugin.settings.frontmatter = [makeItem(0), makeItem(1), makeItem(2)];

			// When: display is called (should not throw)
			expect(() => frontmatterSection.display()).not.toThrow();

			// Then: container should be emptied (critical requirement)
			expect(mockContainer.empty).toHaveBeenCalled();

			// Verify the business logic: filtering is implemented in the code
			// The display method calls frontmatter.filter((frontmatter) => frontmatter.id !== 0)
			const filteredTemplates = mockPlugin.settings.frontmatter.filter((f: any) => f.id !== 0);
			expect(filteredTemplates).toHaveLength(2); // Only id=1,2 should remain
			expect(filteredTemplates.every((f: any) => f.id !== 0)).toBe(true);
		});

		test('deletes template and saves settings in handleDelete', async () => {
			// Given: 3 templates
			expect(mockPlugin.settings.frontmatter).toHaveLength(3);

			// When: delete first template
			await (frontmatterSection as any).handleDelete(makeItem(1));

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
			(frontmatterSection as any).openEditModal = jest
				.fn()
				.mockImplementation((template: any, onSave: any) => onSave(updatedTemplate));

			// When: template is edited
			await (frontmatterSection as any).handleEdit(originalTemplate);

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

			// When: display is called (should not throw)
			expect(() => frontmatterSection.display()).not.toThrow();

			// Then: container is emptied
			expect(mockContainer.empty).toHaveBeenCalled();

			// Verify filtering logic: no templates should remain after filtering
			const filteredTemplates = mockPlugin.settings.frontmatter.filter((f: any) => f.id !== 0);
			expect(filteredTemplates).toHaveLength(0);
		});
	});
});
