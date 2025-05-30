import type { FrontmatterTemplate } from 'frontmatter/types';
import type AutoClassifierPlugin from 'main';
import { BaseSettingsComponent } from 'ui/components/BaseSettings';
import type { FrontmatterActions } from 'ui/types';
import { DEFAULT_TAG_SETTING } from '../../utils/constants';

export class Tag extends BaseSettingsComponent {
	constructor(plugin: AutoClassifierPlugin) {
		super(plugin.app, {
			showLinkType: false,
			showOptions: false,
			showTextArea: false,
		});
	}

	display(containerEl: HTMLElement): void {
		containerEl.empty();

		const actions: FrontmatterActions = {
			onEdit: (setting: FrontmatterTemplate) => this.handleEdit(containerEl, setting),
			onDelete: () => {}, // Tag settings cannot be deleted
		};

		this.defaultSettings(containerEl, DEFAULT_TAG_SETTING, actions, false);
	}

	private handleEdit(containerEl: HTMLElement, frontmatterSetting: FrontmatterTemplate): void {
		this.openEditModal(frontmatterSetting, async (updatedFrontmatter) => {
			// Update the tag setting in the frontmatter array
			const tagSettingIndex = this.plugin.settings.frontmatter.findIndex((f) => f.id === 0);
			if (tagSettingIndex !== -1) {
				this.plugin.settings.frontmatter[tagSettingIndex] = updatedFrontmatter;
			}

			await this.plugin.saveSettings();
			this.display(containerEl);
		});
	}
}
