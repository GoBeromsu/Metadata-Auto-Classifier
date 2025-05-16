import { getFrontmatterSetting } from 'frontmatter';

import { BaseSettingsComponent } from './BaseSettingsComponent';

export class Frontmatter extends BaseSettingsComponent {
	constructor(plugin: any) {
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
