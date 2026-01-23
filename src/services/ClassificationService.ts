import { processAPIRequest } from 'api';
import type { TFile, App } from 'obsidian';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { COMMON_CONSTANTS } from '../api/constants';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from '../api/prompt';
import type { ProviderConfig } from '../api/types';
import { getContentWithoutFrontmatter, getFieldValues, insertToFrontMatter } from '../frontmatter';
import type { FrontmatterField } from '../frontmatter/types';

export interface ClassificationContext {
	app: App;
	provider: ProviderConfig;
	model: string;
	classificationRule: string;
	saveSettings: () => Promise<void>;
}

export class ClassificationService {
	constructor(private readonly context: ClassificationContext) {}

	async classify(currentFile: TFile, frontmatter: FrontmatterField): Promise<void> {
		const fileNameWithoutExt = currentFile.name.replace(/\.[^/.]+$/, '');

		// Auto-collect refs from vault if not already set
		if (!frontmatter.refs || frontmatter.refs.length === 0) {
			frontmatter.refs = getFieldValues(
				frontmatter.name,
				this.context.app.vault.getMarkdownFiles(),
				this.context.app.metadataCache
			);
			await this.context.saveSettings();
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
		if (!this.context.provider.apiKey) {
			const error = new Error(
				`API key not configured for provider ${this.context.provider.name}. Please check your settings.`
			);
			CommonNotice.error(error);
			return;
		}

		if (!this.context.model) {
			const error = new Error(`No model selected. Please select a model in the plugin settings.`);
			CommonNotice.error(error);
			return;
		}

		const currentContent = await this.context.app.vault.read(currentFile);
		const content = getContentWithoutFrontmatter(currentContent);
		const promptTemplate = getPromptTemplate(
			frontmatter.count,
			content,
			processedValues,
			frontmatter.customQuery,
			this.context.classificationRule
		);

		const apiResponse = await CommonNotice.withProgress(currentFile.name, frontmatter.name, () =>
			processAPIRequest(
				DEFAULT_SYSTEM_ROLE,
				promptTemplate,
				this.context.provider,
				this.context.model
			)
		);

		if (apiResponse && apiResponse.reliability > COMMON_CONSTANTS.MIN_RELIABILITY_THRESHOLD) {
			const processFrontMatter = (file: TFile, fn: (frontmatter: any) => void) =>
				this.context.app.fileManager.processFrontMatter(file, fn);

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
	}
}
