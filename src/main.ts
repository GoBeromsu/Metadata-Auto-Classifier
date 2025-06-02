import { processAPIRequest } from 'api';
import type { TFile } from 'obsidian';
import { Plugin } from 'obsidian';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from './api/prompt';
import type { ProviderConfig } from './api/types';
import { getContentWithoutFrontmatter, getTags, insertToFrontMatter } from './frontmatter';
import type { FrontmatterTemplate } from './frontmatter/types';
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
			CommonNotice.error(new Error('No active file.'));
			return;
		}

		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) {
			CommonNotice.error(new Error('No provider selected.'));
			return;
		}

		const frontmatter = this.settings.frontmatter.find((fm) => fm.id === frontmatterId);
		if (!frontmatter) {
			CommonNotice.error(new Error(`No setting found for frontmatter ID ${frontmatterId}.`));
			return;
		}
		await this.processFrontmatterItem(selectedProvider, currentFile, frontmatter);
	}

	private readonly processFrontmatterItem = async (
		selectedProvider: ProviderConfig,
		currentFile: TFile,
		frontmatter: FrontmatterTemplate
	): Promise<void> => {
		const fileNameWithoutExt = currentFile.name.replace(/\.[^/.]+$/, '');
		if (frontmatter.name === 'tags') {
			frontmatter.refs = await getTags(this.app.vault.getMarkdownFiles(), this.app.metadataCache);
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
			CommonNotice.error(
				new Error(`Tagging ${fileNameWithoutExt} (${frontmatter.name}) - No values found`)
			);
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

		if (apiResponse && apiResponse.reliability > 0.2) {
			const processFrontMatter = (file: TFile, fn: (frontmatter: any) => void) =>
				this.app.fileManager.processFrontMatter(file, fn);

			await insertToFrontMatter(processFrontMatter, {
				file: currentFile,
				key: frontmatter.name,
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
			CommonNotice.error(
				new Error(
					`Tagging ${fileNameWithoutExt} (${frontmatter.name}) - Low reliability (${apiResponse.reliability})`
				)
			);
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
