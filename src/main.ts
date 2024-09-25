import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, DEFAULT_TAG_SETTING } from './constant';

import { APIHandler } from './api/apiHandler';

import FrontMatterHandler from './frontmatterHandler';
import { Provider } from 'types/apiInterface';
import { AutoClassifierSettings, AutoClassifierSettingTab } from './settings';
import { DEFAULT_CHAT_ROLE, getPromptTemplate } from './templates';

export default class AutoClassifierPlugin extends Plugin {
	apiHandler: APIHandler;
	settings: AutoClassifierSettings;
	frontMatterHandler: FrontMatterHandler;

	async onload() {
		await this.loadSettings();

		this.apiHandler = new APIHandler();
		this.frontMatterHandler = new FrontMatterHandler(this.app);

		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this, this.frontMatterHandler));
	}

	setupCommand() {
		this.settings.frontmatter.forEach((frontmatter) => {
			this.addCommand({
				id: `fetch-frontmatter-${frontmatter.id}`,
				name: `Fetch frontmatter: ${frontmatter.name}`,
				callback: async () => {
					await this.classifyFrontmatter(frontmatter.id);
				},
			});
		});

		this.addCommand({
			id: 'fetch-all-frontmatter',
			name: 'Fetch all frontmatter using current provider',
			callback: async () => {
				await this.processAllFrontmatter();
			},
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'F' }],
		});
	}

	async classifyFrontmatter(frontmatterId: number): Promise<void> {
		await this.processFrontmatter([frontmatterId]);
	}

	async processAllFrontmatter(): Promise<void> {
		const frontmatterIds = this.getAllFrontmatterIds();
		await this.processFrontmatter(frontmatterIds);
	}

	async processFrontmatter(frontmatterIds: number[]): Promise<void> {
		const currentFile = this.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice('No active file.');
			return;
		}

		const currentContent = await this.frontMatterHandler.getMarkdownContentWithoutFrontmatter(
			currentFile
		);
		const selectedProvider = this.getSelectedProvider();
		if (!selectedProvider) return;

		for (const frontmatterId of frontmatterIds) {
			const frontmatter = this.getFrontmatterById(frontmatterId);
			if (!frontmatter) {
				new Notice(`No setting found for frontmatter ID ${frontmatterId}.`);
				continue;
			}

			await this.processFrontmatterItem(selectedProvider, currentFile, currentContent, frontmatter);
		}
	}

	private async processFrontmatterItem(
		selectedProvider: Provider,
		currentFile: TFile,
		content: string,
		frontmatter: { id: number; name: string; count: number; refs?: string[] }
	): Promise<void> {
		const currentValues = frontmatter.refs ?? [];
		const currentValuesString = currentValues.join(', ');
		const promptTemplate = getPromptTemplate(frontmatter.count, content, currentValuesString);

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
				false
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

		if (!this.settings.frontmatter || this.settings.frontmatter.length === 0) {
			this.settings.frontmatter = [DEFAULT_TAG_SETTING];
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

	private getAllFrontmatterIds(): number[] {
		return this.settings.frontmatter.map((fm) => fm.id);
	}
}
