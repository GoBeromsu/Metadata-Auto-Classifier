import type { FrontmatterField } from '../../types';
import type AutoClassifierPlugin from '../../main';
import { ConfigurableSettingModal } from '../modals/FrontmatterEditorModal';
import type {
	FrontmatterActions,
	FrontmatterEditorModalProps,
	SettingsComponent,
	SettingsComponentOptions,
} from '../../types';
import { Setting } from './Setting';

export abstract class BaseSettingsComponent implements SettingsComponent {
	protected abstract readonly options: SettingsComponentOptions;

	constructor(
		protected readonly plugin: AutoClassifierPlugin,
		protected readonly containerEl: HTMLElement
	) {}

	abstract display(frontmatterId?: number): void;

        protected createFrontmatterSetting(
                containerEl: HTMLElement,
                frontmatterSetting: FrontmatterField,
                actions: FrontmatterActions,
                showDeleteButton: boolean = false
        ): void {
		const button = [
			{
				icon: 'pencil',
				tooltip: 'Edit Frontmatter',
				onClick: () => actions.onEdit(frontmatterSetting),
			},
		];
		if (showDeleteButton) {
			button.push({
				icon: 'trash',
				tooltip: 'Delete Frontmatter',
				onClick: () => actions.onDelete(frontmatterSetting),
			});
		}

		Setting.create(containerEl, {
			name: frontmatterSetting.name || 'Please enter name',
			desc: `Type: ${frontmatterSetting.linkType}, Max: ${frontmatterSetting.count?.max ?? 5}, Overwrite: ${frontmatterSetting.overwrite}`,
			buttons: button,
		});
	}

	// Common modal creation and opening logic
        protected openEditModal(
                frontmatterSetting: FrontmatterField,
                onSave: (updatedFrontmatter: FrontmatterField) => Promise<void>
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
