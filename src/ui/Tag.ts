import { FrontmatterTemplate } from 'shared/constant';
import { BaseSettingsComponent } from './BaseSettingsComponent';

export class Tag extends BaseSettingsComponent {
	display(containerEl: HTMLElement): void {
		containerEl.empty();
		this.addTagSettings(containerEl);
	}

	private addTagSettings(containerEl: HTMLElement): void {
		const tagSetting = this.frontMatterHandler.getFrontmatterSetting(DEFAULT_TAG_SETTING.id);

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
