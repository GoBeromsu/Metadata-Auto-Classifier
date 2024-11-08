import { App, Modal, Notice, Setting } from 'obsidian';
import { ProviderConfig } from 'utils/interface';
import AutoClassifierPlugin from 'main';
import { LMSTUDIO_STRUCTURE_OUTPUT } from 'utils/constant';
import { createRequestBody } from 'api';

export class CustomFormatModal extends Modal {
	private previewEl: HTMLElement;

	constructor(app: App, private provider: ProviderConfig, private plugin: AutoClassifierPlugin) {
		super(app);
		this.modalEl.addClass('custom-format-modal');
	}

	updatePreview(formatValue: string) {
		try {
			const parsedFormat = formatValue.trim() === '' ? {} : JSON.parse(formatValue);

			const baseRequestBody = {
				model: this.provider.models[0]?.name || 'default-model',
				messages: [
					{
						role: 'system',
						content: 'Sample system message for preview',
					},
					{
						role: 'user',
						content: 'Sample user message for preview',
					},
				],
				temperature: this.provider.temperature || 0.7,
			};

			const previewData = {
				...baseRequestBody,
				...(parsedFormat || { response_format: LMSTUDIO_STRUCTURE_OUTPUT }),
			};

			this.previewEl.setText(JSON.stringify(previewData, null, 2));
		} catch (e) {
			this.previewEl.setText('Invalid JSON format');
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Main title
		const titleEl = contentEl.createEl('h2', { text: 'Custom Request Format' });
		titleEl.addClass('custom-format-title');

		// Create a container with flex layout
		const container = contentEl.createEl('div');
		container.addClass('custom-format-container');

		// Left side - Format input
		const leftPanel = container.createEl('div');
		leftPanel.addClass('custom-format-panel');

		// Right side - Preview
		const rightPanel = container.createEl('div');
		rightPanel.addClass('custom-format-panel');

		// Panel titles
		const leftTitle = leftPanel.createEl('h3', { text: 'Format Input' });
		leftTitle.addClass('custom-format-panel-title');

		const rightTitle = rightPanel.createEl('h3', { text: 'Request Body Preview' });
		rightTitle.addClass('custom-format-panel-title');

		// Text area with full height
		const textArea = leftPanel.createEl('textarea');
		textArea.addClass('custom-format-textarea');

		// Preview section with full height
		this.previewEl = rightPanel.createEl('pre');
		this.previewEl.addClass('custom-format-preview');

		// Bottom info section
		const bottomSection = contentEl.createEl('div');
		bottomSection.addClass('custom-format-bottom');

		const infoDiv = bottomSection.createEl('div');
		infoDiv.addClass('custom-format-info');

		infoDiv.createSpan({
			text: 'The default format follows the LM Studio structured output format. Learn more at ',
		});

		infoDiv.createEl('a', {
			text: 'LM Studio Documentation',
			href: 'https://lmstudio.ai/docs/advanced/structured-output',
			attr: {
				target: '_blank',
				rel: 'noopener',
			},
		});

		// Buttons
		const settingDiv = bottomSection.createEl('div');
		new Setting(settingDiv)
			.setClass('custom-format-buttons')
			.addButton((button) =>
				button
					.setButtonText('Reset to Default')
					.setClass('custom-format-button')
					.onClick(async () => {
						textArea.value = JSON.stringify(LMSTUDIO_STRUCTURE_OUTPUT, null, 2);
						this.updatePreview(textArea.value);
						this.provider.customRequestFormat = JSON.stringify(LMSTUDIO_STRUCTURE_OUTPUT);
						await this.plugin.saveSettings();
						new Notice('Reset to default format');
					})
			)
			.addButton((button) =>
				button
					.setButtonText('Save')
					.setCta()
					.setClass('custom-format-button')
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
			.addButton((button) =>
				button
					.setButtonText('Cancel')
					.setClass('custom-format-button')
					.onClick(() => this.close())
			);

		// Load existing format or default
		const currentFormat = this.provider.customRequestFormat
			? JSON.parse(this.provider.customRequestFormat)
			: LMSTUDIO_STRUCTURE_OUTPUT;

		textArea.value = JSON.stringify(currentFormat, null, 2);
		this.updatePreview(textArea.value);

		// Update preview when text changes
		textArea.addEventListener('input', () => {
			this.updatePreview(textArea.value);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
