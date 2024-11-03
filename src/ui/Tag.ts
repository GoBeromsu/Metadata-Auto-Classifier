import { DEFAULT_TAG_SETTING } from '../api/constant';
import { BaseSettingStrategy } from './SettingStrategy';

export class Tag extends BaseSettingStrategy {
	display(containerEl: HTMLElement): void {
		containerEl.empty();
		this.addTagSettings(containerEl);
	}

	private addTagSettings(containerEl: HTMLElement): void {
		const tagSetting = this.getSetting(DEFAULT_TAG_SETTING.id);

		this.addCountSetting(
			containerEl,
			tagSetting,
			'Tags',
			'Default settings for automatic tag assignment',
			DEFAULT_TAG_SETTING.count
		);
	}
}