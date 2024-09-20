import { Setting } from 'obsidian';
import { BaseSettingStrategy } from './SettingStrategy';
import { DEFAULT_TAG_SETTING } from '../constant';

export class Tag extends BaseSettingStrategy {
	display(containerEl: HTMLElement): void {
		containerEl.empty();
		new Setting(containerEl).setName('Tag settings').setHeading();
		this.addTagSettings(containerEl);
		this.addFetchTagsButton(containerEl);
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

	private addFetchTagsButton(containerEl: HTMLElement): void {
		this.addFetchButton(
			containerEl,
			'Fetch all tags',
			'Fetch and save all tags from the vault',
			async () => {
				await this.fetchAndSaveMetadata(DEFAULT_TAG_SETTING.id, () =>
					this.metaDataManager.getAllTags()
				);
			}
		);
	}
}
