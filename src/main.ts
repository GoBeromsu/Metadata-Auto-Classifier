import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from './api/constant';
import { FrontmatterTemplate } from 'shared/constant';

import APIHandler from './api/ApiHandler';

import { Provider } from './types/interface';
import { AutoClassifierSettings, AutoClassifierSettingTab } from './ui';
import FrontMatterHandler from './frontmatter/FrontMatterHandler';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from './utils/templates';

export default class AutoClassifierPlugin extends Plugin {
	apiHandler: APIHandler;
	settings: AutoClassifierSettings;
	frontMatterHandler: FrontMatterHandler;

	async onload() {
		this.apiHandler = new APIHandler();
		this.frontMatterHandler = new FrontMatterHandler(this);
		await this.loadSettings();

		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this, this.frontMatterHandler));
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

	private async processFrontmatterItem(
		selectedProvider: Provider,
		currentFile: TFile,
		frontmatter: FrontmatterTemplate
	): Promise<void> {
		const currentValues = frontmatter.refs;
		if (currentValues.length === 0) {
			new Notice(
				`⛔ ${this.manifest.name}: No current values found for frontmatter ${frontmatter.name}`
			);
			return;
		}
		const content = await this.frontMatterHandler.getMarkdownContentWithoutFrontmatter(currentFile);

		const promptTemplate = getPromptTemplate(frontmatter.count, content, currentValues);

		const chatRole = DEFAULT_CHAT_ROLE;
		const apiResponse = await this.apiHandler.processAPIRequest(
			chatRole,
			promptTemplate,
			selectedProvider
		);

		if (apiResponse && apiResponse.reliability > 0.2) {
			await this.frontMatterHandler.insertToFrontMatter(
				currentFile,
				frontmatter.name,
				apiResponse.output,
				false // overwrite
			);
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
	}

	async loadSettings() {
		const loadedData = await this.loadData();

		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		const tagSetting = this.settings.frontmatter.find((fm) => fm.name === 'tags');

		if (tagSetting && tagSetting.refs.length == 0) {
			tagSetting.refs = await this.frontMatterHandler.getAllTags();
		}
		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private getSelectedProvider(): Provider | undefined {
		return this.settings.providers.find(
			(p) => p.name === this.settings.selectedProvider && p.apiKey
		);
	}

	private getFrontmatterById(id: number) {
		return this.settings.frontmatter.find((fm) => fm.id === id);
	}
}
