import type { FrontmatterTemplate } from 'frontmatter/types';
import { BaseSettingsComponent } from 'ui/components/BaseSettings';
import type { FrontmatterActions, SettingsComponentOptions } from 'ui/types';

export class Frontmatter extends BaseSettingsComponent {
	protected readonly options: SettingsComponentOptions = {
		showLinkType: true,
		showOptions: true,
		showTextArea: true,
	};

	display(): void {
		const { frontmatter } = this.plugin.settings;
		const filteredFrontmatter = frontmatter.filter((frontmatter) => frontmatter.id !== 0);

		this.containerEl.empty();
		filteredFrontmatter.forEach((frontmatter: FrontmatterTemplate) => {
			const actions: FrontmatterActions = {
				onEdit: (setting: FrontmatterTemplate) => this.handleEdit(setting),
				onDelete: (setting: FrontmatterTemplate) => this.handleDelete(setting),
			};

			this.createFrontmatterSetting(this.containerEl, frontmatter, actions, true);
		});
	}

	private handleEdit(frontmatterSetting: FrontmatterTemplate): void {
		this.openEditModal(frontmatterSetting, async (updatedFrontmatter) => {
			// Register command for the updated frontmatter
			this.plugin.registerCommand(
				updatedFrontmatter.name,
				async () => await this.plugin.processFrontmatter(updatedFrontmatter.id)
			);

			await this.plugin.saveSettings();
			this.display();
		});
	}

	private async handleDelete(frontmatterSetting: FrontmatterTemplate): Promise<void> {
		confirm(`Are you sure you want to delete "${frontmatterSetting.name}" frontmatter?`);
		this.plugin.settings.frontmatter = this.plugin.settings.frontmatter.filter(
			(f: FrontmatterTemplate) => f.id !== frontmatterSetting.id
		);

		await this.plugin.saveSettings();
		this.display();
	}
}
