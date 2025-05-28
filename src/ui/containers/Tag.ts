import { DEFAULT_TAG_SETTING } from '../../utils/constants';
import { BaseSettingsComponent } from 'ui/components/BaseSettings';
import type AutoClassifierPlugin from 'main';

export class Tag extends BaseSettingsComponent {
	constructor(plugin: AutoClassifierPlugin) {
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
