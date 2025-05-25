import { processAPIRequest } from 'api';
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_TAG_SETTING, getDefaultProviders } from 'utils/constants';
import { FrontmatterTemplate, ProviderConfig } from 'utils/interface';
import { getContentWithoutFrontmatter, getTags, insertToFrontMatter } from './frontmatter';
import { AutoClassifierSettings, AutoClassifierSettingTab } from './ui';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from './utils/templates';

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
			new Notice('No active file.');
			return;
		}

		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) {
			new Notice('No provider selected.');
			return;
		}

		const frontmatter = this.getFrontmatterById(frontmatterId);
		if (!frontmatter) {
			new Notice(`No setting found for frontmatter ID ${frontmatterId}.`);
			return;
		}
		await this.processFrontmatterItem(selectedProvider, currentFile, frontmatter);
	}

	private processFrontmatterItem = async (
		selectedProvider: ProviderConfig,
		currentFile: TFile,
		frontmatter: FrontmatterTemplate
	): Promise<void> => {
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
			new Notice(
				`⛔ ${this.manifest.name}: No current values found for frontmatter ${frontmatter.name}`
			);
			return;
		}
		const currentContent = await this.app.vault.read(currentFile);
		const content = getContentWithoutFrontmatter(currentContent);

		const promptTemplate = getPromptTemplate(
			frontmatter.count,
			content,
			processedValues,
			frontmatter.customQuery,
			selectedProvider.customPromptTemplate
		);

		const apiResponse = await processAPIRequest(
			DEFAULT_SYSTEM_ROLE,
			promptTemplate,
			selectedProvider,
			this.settings.selectedModel
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

			// Display the appropriate format in the notification based on linkType
			const displayOutput =
				frontmatter.linkType === 'WikiLink'
					? apiResponse.output.map((item) => `[[${item}]]`)
					: apiResponse.output;

			new Notice(
				`✅ ${apiResponse.output.length} ${frontmatter.name} added: ${displayOutput.join(', ')}`
			);
		} else if (apiResponse) {
			new Notice(
				`⛔ ${this.manifest.name}: Response has low reliability (${apiResponse.reliability})`
			);
		}
	};

	async loadSettings() {
		const loadedData = (await this.loadData()) || {};

		// Use simple assignment instead of mergeDefaults to preserve user data
		this.settings = {
			providers: loadedData.providers || getDefaultProviders(),
			selectedProvider: loadedData.selectedProvider || '',
			selectedModel: loadedData.selectedModel || '',
			frontmatter: loadedData.frontmatter || [DEFAULT_TAG_SETTING],
		};

		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Get selected provider based on selectedProvider setting
	private getSelectedProvider(): ProviderConfig | undefined {
		if (!this.settings.selectedProvider) {
			return undefined;
		}

		return this.settings.providers.find(
			(provider) => provider.name === this.settings.selectedProvider
		);
	}

	private getFrontmatterById(id: number) {
		return this.settings.frontmatter.find((fm) => fm.id === id);
	}
}
