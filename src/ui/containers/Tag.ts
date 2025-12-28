import type { FrontmatterField } from 'frontmatter/types';
import { BaseSettingsComponent } from 'ui/components/BaseSettings';
import type { FrontmatterActions, SettingsComponentOptions } from 'ui/types';

export class Tag extends BaseSettingsComponent {
	protected readonly options: SettingsComponentOptions = {
		showLinkType: false,
		showOptions: false,
		showTextArea: false,
	};

	display(): void {
		this.containerEl.empty();

		const tagSetting = this.plugin.settings.frontmatter.find((f) => f.id === 0);
		if (!tagSetting) {
			return;
		}

                const actions: FrontmatterActions = {
                        onEdit: (setting: FrontmatterField) => this.handleEdit(setting),
			onDelete: () => {},
		};

		this.createFrontmatterSetting(this.containerEl, tagSetting, actions, false);
	}

        private handleEdit(frontmatterSetting: FrontmatterField): void {
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
