import { processAPIRequest } from 'api';
import type { TFile } from 'obsidian';
import { Plugin } from 'obsidian';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { COMMON_CONSTANTS } from './api/constants';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from './api/prompt';
import type { ProviderConfig } from './api/types';
import { getContentWithoutFrontmatter, getFieldValues, insertToFrontMatter } from './frontmatter';
import type { FrontmatterField } from './frontmatter/types';
import type { AutoClassifierSettings } from './ui';
import { AutoClassifierSettingTab } from './ui';
import { DEFAULT_SETTINGS } from './utils/constants';

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;
	async onload() {
		await this.loadSettings();
		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this));
	}

	setupCommand() {
		this.settings.frontmatter.forEach((fm) => {
			this.registerCommand(fm.name, async () => await this.processFrontmatter(fm.id));
		});

		this.registerCommand(
			'Fetch all frontmatter using current provider',
			async () => await this.processAllFrontmatter()
		);
	}

	registerCommand(name: string, callback: () => Promise<void>) {
		this.addCommand({
			id: `fetch-frontmatter-${name}`,
			name: `Fetch frontmatter: ${name}`,
			callback: async () => await callback(),
		});
	}

	async processAllFrontmatter(): Promise<void> {
		const frontmatterIds = this.settings.frontmatter.map((fm) => fm.id);
		for (const frontmatterId of frontmatterIds) {
			await this.processFrontmatter(frontmatterId);
		}
	}

	async processFrontmatter(frontmatterId: number): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			const error = new Error('No active file.');
			CommonNotice.error(error);
			return;
		}

		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) {
			const error = new Error('No provider selected.');
			CommonNotice.error(error);
			return;
		}

		const frontmatter = this.settings.frontmatter.find((fm) => fm.id === frontmatterId);
		if (!frontmatter) {
			const error = new Error(`No setting found for frontmatter ID ${frontmatterId}.`);
			CommonNotice.error(error);
			return;
		}
		await this.processFrontmatterItem(selectedProvider, currentFile, frontmatter);
	}

	private readonly processFrontmatterItem = async (
		selectedProvider: ProviderConfig,
		currentFile: TFile,
		frontmatter: FrontmatterField
	): Promise<void> => {
		const fileNameWithoutExt = currentFile.name.replace(/\.[^/.]+$/, '');
		// Auto-collect refs from vault if not already set
		if (!frontmatter.refs || frontmatter.refs.length === 0) {
			frontmatter.refs = getFieldValues(
				frontmatter.name,
				this.app.vault.getMarkdownFiles(),
				this.app.metadataCache
			);
			await this.saveSettings();
		}

		const currentValues = frontmatter.refs;

		const processedValues =
			frontmatter.linkType === 'WikiLink'
				? currentValues.map((value) =>
						value.startsWith('[[') && value.endsWith(']]') ? value.slice(2, -2) : value
					)
				: currentValues;

		if (processedValues.length === 0) {
			const error = new Error(
				`Tagging ${fileNameWithoutExt} (${frontmatter.name}) - No reference values found. Please add some reference tags/categories in the plugin settings.`
			);
			CommonNotice.error(error);
			return;
		}

		// Validate API configuration
		if (!selectedProvider.apiKey) {
			const error = new Error(
				`API key not configured for provider ${selectedProvider.name}. Please check your settings.`
			);
			CommonNotice.error(error);
			return;
		}

		if (!this.settings.selectedModel) {
			const error = new Error(`No model selected. Please select a model in the plugin settings.`);
			CommonNotice.error(error);
			return;
		}
		const currentContent = await this.app.vault.read(currentFile);
		const content = getContentWithoutFrontmatter(currentContent);
		const classificationRule = this.settings.classificationRule;
		const promptTemplate = getPromptTemplate(
			frontmatter.count,
			content,
			processedValues,
			frontmatter.customQuery,
			classificationRule
		);

		const apiResponse = await CommonNotice.withProgress(currentFile.name, frontmatter.name, () =>
			processAPIRequest(
				DEFAULT_SYSTEM_ROLE,
				promptTemplate,
				selectedProvider,
				this.settings.selectedModel
			)
		);

		if (apiResponse && apiResponse.reliability > COMMON_CONSTANTS.MIN_RELIABILITY_THRESHOLD) {
			const processFrontMatter = (file: TFile, fn: (frontmatter: any) => void) =>
				this.app.fileManager.processFrontMatter(file, fn);

			await insertToFrontMatter(processFrontMatter, {
				file: currentFile,
				name: frontmatter.name,
				value: apiResponse.output,
				overwrite: frontmatter.overwrite,
				linkType: frontmatter.linkType,
			});
			const successMessage = [
				`✓ ${fileNameWithoutExt} (${frontmatter.name})`,
				`Reliability: ${apiResponse.reliability}`,
				'Added:',
				...apiResponse.output.map((tag) => `- ${tag}`),
			].join('\n');

			CommonNotice.success(successMessage);
		} else if (apiResponse) {
			const error = new Error(
				`Tagging ${fileNameWithoutExt} (${frontmatter.name}) - Low reliability (${apiResponse.reliability})`
			);
			CommonNotice.error(error);
		}
	};

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	public getSelectedProvider(): ProviderConfig {
		const provider = this.settings.providers.find(
			(provider) => provider.name === this.settings.selectedProvider
		);
		if (!provider) throw new Error('Selected provider not found');

		return provider;
	}
}
