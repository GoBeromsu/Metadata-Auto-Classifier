import type { FrontmatterTemplate } from 'frontmatter/types';
import type AutoClassifierPlugin from 'main';
import { ConfigurableSettingModal } from 'ui/modals/FrontmatterEditorModal';
import { CommonSetting } from './common/CommonSetting';

export interface SettingsComponentOptions {
	showLinkType?: boolean;
	showOptions?: boolean;
	showTextArea?: boolean;
}

export interface SettingsComponent {
	display(containerEl: HTMLElement, frontmatterId?: number): void;
}

export abstract class BaseSettingsComponent implements SettingsComponent {
	protected options: SettingsComponentOptions;

	constructor(protected plugin: AutoClassifierPlugin, options: SettingsComponentOptions = {}) {
		this.options = {
			showLinkType: true,
			showOptions: true,
			showTextArea: true,
			...options,
		};
	}

	abstract display(containerEl: HTMLElement, frontmatterId?: number): void;

	defaultSettings(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate,
		showDeleteButton: boolean = false
	): void {
		CommonSetting.create(containerEl, {
			name: frontmatterSetting.name || 'Please enter name',
			desc: `Type: ${frontmatterSetting.linkType}, Count: ${frontmatterSetting.count.min}-${frontmatterSetting.count.max}`,
			extraButton: {
				icon: 'pencil',
				tooltip: 'Edit Frontmatter',
				onClick: () => {
					const modal = new ConfigurableSettingModal(
						this.plugin.app,
						this.plugin,
						frontmatterSetting,
						this.options
					);

					modal.open();
				},
			},
			...(showDeleteButton && {
				buttons: [
					{
						icon: 'trash',
						tooltip: 'Delete Frontmatter',
						onClick: async () => {
							if (
								confirm(`Are you sure you want to delete "${frontmatterSetting.name}" frontmatter?`)
							) {
								this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
									(f: FrontmatterTemplate) => f.id !== frontmatterSetting.id
								);
								await this.plugin.saveSettings();
								containerEl.empty();
							}
						},
					},
				],
			}),
		});
	}
}
