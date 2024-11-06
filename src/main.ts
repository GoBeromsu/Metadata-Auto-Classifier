import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from 'utils/constant';
import { FrontmatterTemplate, ProviderConfig } from 'utils/interface';
import { getContentWithoutFrontmatter, getTags, insertToFrontMatter } from './frontmatter';

import { processAPIRequest } from 'api';
import { AutoClassifierSettings, AutoClassifierSettingTab } from './ui';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from './utils/templates';

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;

	async onload() {
		await this.loadSettings();

		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this));
	}

	setupCommand() {
		this.settings.frontmatter.forEach((frontmatter) => {
			this.addCommand({
				id: `fetch-frontmatter-${frontmatter.id}`,
				name: `Fetch frontmatter: ${frontmatter.name}`,
				callback: async () => {
					await this.processFrontmatter(frontmatter.id);
				},
			});
		});

		this.addCommand({
			id: 'fetch-all-frontmatter',
			name: 'Fetch all frontmatter using current provider',
			callback: async () => {
				await this.processAllFrontmatter();
			},
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

		if (currentValues.length === 0) {
			new Notice(
				`⛔ ${this.manifest.name}: No current values found for frontmatter ${frontmatter.name}`
			);
			return;
		}
		const currentContent = await this.app.vault.read(currentFile);
		const content = getContentWithoutFrontmatter(currentContent);

		const promptTemplate = getPromptTemplate(frontmatter.count, content, currentValues);

		const chatRole = DEFAULT_CHAT_ROLE;
		const selectedModel = this.settings.selectedModel;

		const apiResponse = await processAPIRequest(
			chatRole,
			promptTemplate,
			selectedProvider,
			selectedModel
		);

		if (apiResponse && apiResponse.reliability > 0.2) {
			const processFrontMatter = (file: TFile, fn: (frontmatter: any) => void) =>
				this.app.fileManager.processFrontMatter(file, fn);

			await insertToFrontMatter(processFrontMatter, {
				file: currentFile,
				key: frontmatter.name,
				value: apiResponse.output,
				overwrite: false,
			});

			new Notice(
				`✅ ${apiResponse.output.length} ${frontmatter.name} added: ${apiResponse.output.join(
					', '
				)}`
			);
		} else if (apiResponse) {
			new Notice(
				`⛔ ${this.manifest.name}: Response has low reliability (${apiResponse.reliability})`
			);
		}
	};

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// erase key validation
	private getSelectedProvider(): ProviderConfig | undefined {
		return this.settings.providers.find((p) => p.name === this.settings.selectedProvider);
	}

	private getFrontmatterById(id: number) {
		return this.settings.frontmatter.find((fm) => fm.id === id);
	}
}
