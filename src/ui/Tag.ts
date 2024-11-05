import { getFrontmatterSetting } from 'frontmatter';

import { BaseSettingsComponent } from './BaseSettingsComponent';
import { FrontmatterTemplate } from 'utils/interface';
export class Tag extends BaseSettingsComponent {
	display(containerEl: HTMLElement): void {
		containerEl.empty();
		this.addTagSettings(containerEl);
	}

	private addTagSettings(containerEl: HTMLElement): void {
		const tagSetting = getFrontmatterSetting(
			DEFAULT_TAG_SETTING.id,
			this.plugin.settings.frontmatter
		);

		this.addCountSetting(
			containerEl,
			tagSetting,
			'Tags',
			'Default settings for automatic tag assignment',
			DEFAULT_TAG_SETTING.count
		);
	}
}
// Default tag settings

export const DEFAULT_TAG_SETTING: FrontmatterTemplate = {
	id: 0,
	name: 'tags',
	refs: [],
	count: 5,
};
