import type { FrontmatterTemplate } from 'frontmatter/types';
import type AutoClassifierPlugin from 'main';
import { ConfigurableSettingModal } from 'ui/modals/FrontmatterEditorModal';
import type {
	FrontmatterActions,
	FrontmatterEditorModalProps,
	SettingsComponent,
	SettingsComponentOptions,
} from 'ui/types';
import { CommonSetting } from './common/CommonSetting';

export abstract class BaseSettingsComponent implements SettingsComponent {
	protected abstract readonly options: SettingsComponentOptions;

	constructor(protected readonly plugin: AutoClassifierPlugin) {}

	abstract display(containerEl: HTMLElement, frontmatterId?: number): void;

	protected defaultSettings(
		containerEl: HTMLElement,
		frontmatterSetting: FrontmatterTemplate,
		actions: FrontmatterActions,
		showDeleteButton: boolean = false
	): void {
		CommonSetting.create(containerEl, {
			name: frontmatterSetting.name || 'Please enter name',
			desc: `Type: ${frontmatterSetting.linkType}, Count: ${frontmatterSetting.count.min}-${frontmatterSetting.count.max}`,
			extraButton: {
				icon: 'pencil',
				tooltip: 'Edit Frontmatter',
				onClick: () => actions.onEdit(frontmatterSetting),
			},
			...(showDeleteButton && {
				buttons: [
					{
						icon: 'trash',
						tooltip: 'Delete Frontmatter',
						onClick: () => actions.onDelete(frontmatterSetting),
					},
				],
			}),
		});
	}

	// Common modal creation and opening logic
	protected openEditModal(
		frontmatterSetting: FrontmatterTemplate,
		onSave: (updatedFrontmatter: FrontmatterTemplate) => Promise<void>
	): void {
		const modalProps: FrontmatterEditorModalProps = {
			frontmatterSetting: frontmatterSetting,
			options: this.options,
			onSave: onSave,
		};

		const modal = new ConfigurableSettingModal(this.plugin.app, modalProps);
		modal.open();
	}
}
