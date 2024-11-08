import { App, Modal, Notice, Setting } from 'obsidian';
import { ProviderConfig } from 'utils/interface';
import AutoClassifierPlugin from 'main';
import { LMSTUDIO_STRUCTURE_OUTPUT } from 'utils/constant';

export class CustomFormatModal extends Modal {
	constructor(app: App, private provider: ProviderConfig, private plugin: AutoClassifierPlugin) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Custom Request Format' });

		const infoDiv = contentEl.createEl('div', {
			cls: 'custom-format-info',
		});

		const fragment = document.createDocumentFragment();
		fragment.append(
			'The default format follows the LM Studio structured output format.',
			document.createElement('br'),
			document.createElement('br'),
			'Learn more at '
		);

		infoDiv.appendChild(fragment);

		infoDiv.createEl('a', {
			text: 'LM Studio Documentation',
			href: 'https://lmstudio.ai/docs/advanced/structured-output',
			attr: {
				target: '_blank',
				rel: 'noopener',
			},
		});

		contentEl.createEl('br');

		const textArea = contentEl.createEl('textarea', {
			attr: {
				rows: '30',
				style: 'width: 100%; font-family: monospace;',
			},
		});

		// Load existing format or default
		const currentFormat = this.provider.customRequestFormat
			? JSON.parse(this.provider.customRequestFormat)
			: LMSTUDIO_STRUCTURE_OUTPUT;

		textArea.value = JSON.stringify(currentFormat, null, 2);

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText('Reset to Default').onClick(async () => {
					textArea.value = JSON.stringify(LMSTUDIO_STRUCTURE_OUTPUT, null, 2);
					this.provider.customRequestFormat = JSON.stringify(LMSTUDIO_STRUCTURE_OUTPUT);
					await this.plugin.saveSettings();
					new Notice('Reset to default format');
				})
			)
			.addButton((button) =>
				button
					.setButtonText('Save')
					.setCta()
					.onClick(async () => {
						try {
							const formatValue = textArea.value.trim() === '' ? '{}' : textArea.value;
							const parsedFormat = JSON.parse(formatValue);
							this.provider.customRequestFormat = JSON.stringify(parsedFormat);
							await this.plugin.saveSettings();
							this.close();
						} catch (e) {
							new Notice('Invalid JSON format');
						}
					})
			)
			.addButton((button) => button.setButtonText('Cancel').onClick(() => this.close()));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
