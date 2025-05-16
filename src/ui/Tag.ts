import { DEFAULT_TAG_SETTING } from 'utils/constant';
import { BaseSettingsComponent } from './BaseSettingsComponent';

export class Tag extends BaseSettingsComponent {
	constructor(plugin: any) {
		super(plugin, {
			showLinkType: false,
			showOptions: false,
			showTextArea: false,
		});
	}

	display(containerEl: HTMLElement): void {
		containerEl.empty();
		this.defaultSettings(containerEl, DEFAULT_TAG_SETTING, false);
	}
}
