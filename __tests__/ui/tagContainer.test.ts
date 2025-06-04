jest.mock('../../src/ui/modals/FrontmatterEditorModal', () => ({
	ConfigurableSettingModal: class {},
}));

import { Tag } from '../../src/ui/containers/Tag';
import { DEFAULT_TAG_SETTING } from '../../src/utils/constants';

describe('Tag container', () => {
	test('handleEdit updates tag setting and saves', async () => {
		const plugin: any = {
			settings: { frontmatter: [{ ...DEFAULT_TAG_SETTING }] },
			saveSettings: jest.fn().mockResolvedValue(undefined),
		};
		const tag = new Tag(plugin, {} as HTMLElement);
		tag.display = jest.fn();
		(tag as any).openEditModal = (_: any, onSave: (s: any) => Promise<void>) =>
			onSave({ ...DEFAULT_TAG_SETTING, name: 'new' });
		await (tag as any).handleEdit(DEFAULT_TAG_SETTING);
		expect(plugin.settings.frontmatter[0].name).toBe('new');
		expect(plugin.saveSettings).toHaveBeenCalled();
		expect(tag.display).toHaveBeenCalled();
	});
});
