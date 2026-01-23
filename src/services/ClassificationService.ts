import { processAPIRequest } from 'api';
import type { TFile, App } from 'obsidian';
import { CommonNotice } from 'ui/components/common/CommonNotice';
import { COMMON_CONSTANTS } from '../api/constants';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from '../api/prompt';
import type { ProviderConfig, StructuredOutput } from '../api/types';
import { getContentWithoutFrontmatter, getFieldValues, insertToFrontMatter } from '../frontmatter';
import type { FrontmatterField, FrontMatter } from '../frontmatter/types';

export interface ClassificationContext {
	app: App;
	provider: ProviderConfig;
	model: string;
	classificationRule: string;
	saveSettings: () => Promise<void>;
}

interface ValidationResult {
	isValid: boolean;
	processedValues: string[];
	errorMessage?: string;
}

export class ClassificationService {
	constructor(private readonly context: ClassificationContext) {}

	async classify(currentFile: TFile, frontmatter: FrontmatterField): Promise<void> {
		const fileNameWithoutExt = currentFile.name.replace(/\.[^/.]+$/, '');

		// Step 1: Prepare and validate input
		await this.ensureRefsExist(frontmatter);
		const validation = this.validateClassificationInput(frontmatter, fileNameWithoutExt);
		if (!validation.isValid) {
			CommonNotice.error(new Error(validation.errorMessage!));
			return;
		}

		// Step 2: Call API
		const currentContent = await this.context.app.vault.read(currentFile);
		const apiResponse = await this.callClassificationAPI(
			currentFile,
			frontmatter,
			currentContent,
			validation.processedValues
		);

		// Step 3: Process result
		if (apiResponse) {
			await this.processClassificationResult(
				currentFile,
				frontmatter,
				apiResponse,
				fileNameWithoutExt
			);
		}
	}

	private async ensureRefsExist(frontmatter: FrontmatterField): Promise<void> {
		if (!frontmatter.refs || frontmatter.refs.length === 0) {
			frontmatter.refs = getFieldValues(
				frontmatter.name,
				this.context.app.vault.getMarkdownFiles(),
				this.context.app.metadataCache
			);
			await this.context.saveSettings();
		}
	}

	private validateClassificationInput(
		frontmatter: FrontmatterField,
		fileNameWithoutExt: string
	): ValidationResult {
		const currentValues = frontmatter.refs;
		const processedValues =
			frontmatter.linkType === 'WikiLink'
				? currentValues.map((value) =>
						value.startsWith('[[') && value.endsWith(']]') ? value.slice(2, -2) : value
					)
				: currentValues;

		if (processedValues.length === 0) {
			return {
				isValid: false,
				processedValues: [],
				errorMessage: `Tagging ${fileNameWithoutExt} (${frontmatter.name}) - No reference values found. Please add some reference tags/categories in the plugin settings.`,
			};
		}

		if (!this.context.provider.apiKey) {
			return {
				isValid: false,
				processedValues: [],
				errorMessage: `API key not configured for provider ${this.context.provider.name}. Please check your settings.`,
			};
		}

		if (!this.context.model) {
			return {
				isValid: false,
				processedValues: [],
				errorMessage: `No model selected. Please select a model in the plugin settings.`,
			};
		}

		return { isValid: true, processedValues };
	}

	private async callClassificationAPI(
		currentFile: TFile,
		frontmatter: FrontmatterField,
		currentContent: string,
		processedValues: string[]
	): Promise<StructuredOutput | null> {
		const content = getContentWithoutFrontmatter(currentContent);
		const promptTemplate = getPromptTemplate(
			frontmatter.count,
			content,
			processedValues,
			frontmatter.customQuery,
			this.context.classificationRule
		);

		return CommonNotice.withProgress(currentFile.name, frontmatter.name, () =>
			processAPIRequest(
				DEFAULT_SYSTEM_ROLE,
				promptTemplate,
				this.context.provider,
				this.context.model
			)
		);
	}

	private async processClassificationResult(
		currentFile: TFile,
		frontmatter: FrontmatterField,
		apiResponse: StructuredOutput,
		fileNameWithoutExt: string
	): Promise<void> {
		if (apiResponse.reliability > COMMON_CONSTANTS.MIN_RELIABILITY_THRESHOLD) {
			const processFrontMatter = (file: TFile, fn: (fm: FrontMatter) => void) =>
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
		} else {
			const error = new Error(
				`Tagging ${fileNameWithoutExt} (${frontmatter.name}) - Low reliability (${apiResponse.reliability})`
			);
			CommonNotice.error(error);
		}
	}
}
