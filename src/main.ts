import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from 'utils/constant';
import { FrontmatterTemplate, ProviderConfig } from 'utils/interface';
import { getContentWithoutFrontmatter, getTags, insertToFrontMatter } from './frontmatter';

import { processAPIRequest } from 'api';
import { AutoClassifierSettings, AutoClassifierSettingTab, SelectFrontmatterModal } from './ui';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from './utils/templates';
import { mergeDefaults } from 'utils';

export default class AutoClassifierPlugin extends Plugin {
	settings: AutoClassifierSettings;

	async onload() {
		await this.loadSettings();

		this.setupCommand();
		this.addSettingTab(new AutoClassifierSettingTab(this));
	}

	setupCommand() {
		// 단일 프론트매터 처리 명령
		this.addCommand({
			id: 'fetch-specific-frontmatter',
			name: 'Fetch specific frontmatter',
			callback: async () => {
				// 현재 설정된 모든 프론트매터 목록을 표시하는 모달
				const frontmatters = this.settings.frontmatter
					.filter((fm) => fm.name !== 'tags') // 내장 태그는 별도로 처리
					.map((fm) => ({
						name: fm.name,
						id: fm.id,
					}));

				if (frontmatters.length === 0) {
					new Notice('No frontmatter settings defined. Please add some in settings.');
					return;
				}

				// 간단한 선택 모달 표시
				const modal = new SelectFrontmatterModal(
					this.app,
					frontmatters,
					async (selected: number | null) => {
						if (selected !== null) {
							await this.processFrontmatter(selected);
						}
					}
				);
				modal.open();
			},
		});

		// 태그 프론트매터 처리를 위한 별도 명령
		this.addCommand({
			id: 'fetch-tags',
			name: 'Fetch frontmatter: tags',
			callback: async () => {
				const tagsFrontmatter = this.settings.frontmatter.find((fm) => fm.name === 'tags');
				if (tagsFrontmatter) {
					await this.processFrontmatter(tagsFrontmatter.id);
				} else {
					new Notice('Tags frontmatter not found.');
				}
			},
		});

		// 모든 프론트매터 처리 명령
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

		const promptTemplate = getPromptTemplate(frontmatter.count, content, processedValues);

		const selectedModel = selectedProvider.selectedModel || this.settings.selectedModel;

		const apiResponse = await processAPIRequest(
			DEFAULT_SYSTEM_ROLE,
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
		this.settings = mergeDefaults(DEFAULT_SETTINGS, loadedData);

		// Ensure each provider has a selectedModel property
		this.settings.providers.forEach((provider) => {
			if (!provider.selectedModel && provider.models.length > 0) {
				provider.selectedModel = provider.models[0].name;
			}
		});

		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// erase key validation
	private getSelectedProvider(): ProviderConfig | undefined {
		const provider = this.settings.providers.find((p) => p.name === this.settings.selectedProvider);

		// If the provider exists but doesn't have a selectedModel, set it
		if (provider && !provider.selectedModel && provider.models.length > 0) {
			provider.selectedModel = provider.models[0].name;
			this.saveSettings();
		}

		return provider;
	}

	private getFrontmatterById(id: number) {
		return this.settings.frontmatter.find((fm) => fm.id === id);
	}
}
