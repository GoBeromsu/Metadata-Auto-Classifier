import { getFrontmatterSetting } from 'frontmatter';
import type AutoClassifierPlugin from 'main';
import { BaseSettingsComponent } from 'ui/components/BaseSettings';

export class Frontmatter extends BaseSettingsComponent {
	constructor(plugin: AutoClassifierPlugin) {
		super(plugin, {
			showLinkType: true,
			showOptions: true,
			showTextArea: true,
		});
	}

	display(containerEl: HTMLElement, frontmatterId: number): void {
		containerEl.empty();

		const frontmatterSetting = getFrontmatterSetting(
			frontmatterId,
			this.plugin.settings.frontmatter
		);
		this.defaultSettings(containerEl, frontmatterSetting, true);
	}
}
