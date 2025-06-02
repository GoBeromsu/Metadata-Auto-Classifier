import type { FrontmatterTemplate } from 'frontmatter/types';
import { BaseSettingsComponent } from 'ui/components/BaseSettings';
import type { FrontmatterActions, SettingsComponentOptions } from 'ui/types';
import { DEFAULT_TAG_SETTING } from '../../utils/constants';

export class Tag extends BaseSettingsComponent {
	protected readonly options: SettingsComponentOptions = {
		showLinkType: false,
		showOptions: false,
		showTextArea: false,
	};

	display(): void {
		const actions: FrontmatterActions = {
			onEdit: (setting: FrontmatterTemplate) => this.handleEdit(setting),
			onDelete: () => {},
		};

		this.defaultSettings(this.containerEl, DEFAULT_TAG_SETTING, actions, false);
	}

	private handleEdit(frontmatterSetting: FrontmatterTemplate): void {
		this.openEditModal(frontmatterSetting, async (updatedFrontmatter) => {
			const tagSettingIndex = this.plugin.settings.frontmatter.findIndex((f) => f.id === 0);
			if (tagSettingIndex !== -1) {
				this.plugin.settings.frontmatter[tagSettingIndex] = updatedFrontmatter;
			}

			await this.plugin.saveSettings();
			this.display();
		});
	}
}
