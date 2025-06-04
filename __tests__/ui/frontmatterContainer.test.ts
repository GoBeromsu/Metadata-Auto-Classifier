jest.mock('../../src/ui/modals/FrontmatterEditorModal', () => ({
	ConfigurableSettingModal: class {},
}));

import { Frontmatter } from '../../src/ui/containers/Frontmatter';

const makeItem = (id: number) => ({
	id,
	name: `f${id}`,
	count: { min: 1, max: 1 },
	refs: [],
	overwrite: false,
	linkType: 'WikiLink',
	customQuery: '',
});

describe('Frontmatter container', () => {
	test('handleDelete removes item and saves', async () => {
		const plugin: any = {
			settings: { frontmatter: [makeItem(1), makeItem(2)] },
			saveSettings: jest.fn().mockResolvedValue(undefined),
		};
		const frontmatter = new Frontmatter(plugin, {} as HTMLElement);
		frontmatter.display = jest.fn();
		(global as any).confirm = jest.fn();
		await (frontmatter as any).handleDelete(makeItem(1));
		expect(plugin.settings.frontmatter).toHaveLength(1);
		expect(plugin.settings.frontmatter[0].id).toBe(2);
		expect(plugin.saveSettings).toHaveBeenCalled();
		expect(frontmatter.display).toHaveBeenCalled();
	});
});
