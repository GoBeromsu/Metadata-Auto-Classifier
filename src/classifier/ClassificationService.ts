import type { TFile, App } from 'obsidian';

import { COMMON_CONSTANTS } from '../constants';
import {
	getContentWithoutFrontmatter,
	getFieldValues,
	insertToFrontMatter,
} from '../lib/frontmatter';
import { processAPIRequest } from '../provider';
import { DEFAULT_SYSTEM_ROLE, getPromptTemplate } from '../provider/prompt';
import { Notice } from '../settings/components/Notice';
import type { FrontmatterField, FrontMatter, ProviderConfig, StructuredOutput } from '../types';

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

	/**
	 * Check if the provider has valid authentication configured
	 * Supports both new auth field and legacy apiKey/oauth fields
	 */
	private hasValidAuth(provider: ProviderConfig): boolean {
		// New unified auth format
		if (provider.auth) {
			if (provider.auth.type === 'apiKey') {
				return Boolean(provider.auth.apiKey);
			}
			if (provider.auth.type === 'oauth') {
				return Boolean(provider.auth.oauth?.accessToken);
			}
		}

		// Legacy format
		if (provider.authType === 'oauth') {
			return Boolean(provider.oauth?.accessToken);
		}
		return Boolean(provider.apiKey);
	}

	async classify(currentFile: TFile, frontmatter: FrontmatterField): Promise<void> {
		const fileNameWithoutExt = currentFile.name.replace(/\.[^/.]+$/, '');

		// Step 1: Prepare and validate input
		await this.ensureRefsExist(frontmatter);
		const validation = this.validateClassificationInput(frontmatter, fileNameWithoutExt);
		if (!validation.isValid) {
			Notice.error(new Error(validation.errorMessage!));
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

		// Validate authentication based on provider auth type
		if (!this.hasValidAuth(this.context.provider)) {
			const authType = this.context.provider.authType ?? 'apiKey';
			const errorMessage =
				authType === 'oauth'
					? `OAuth not configured for provider ${this.context.provider.name}. Please connect your account in settings.`
					: `API key not configured for provider ${this.context.provider.name}. Please check your settings.`;
			return {
				isValid: false,
				processedValues: [],
				errorMessage,
			};
		}

		if (!this.context.model) {
			return {
				isValid: false,
				processedValues: [],
				errorMessage: `No model selected. Please select a model in the plugin settings.`,
			};
		}

		// Validate model belongs to selected provider
		const providerModels = this.context.provider.models.map((m) => m.id);
		if (!providerModels.includes(this.context.model)) {
			return {
				isValid: false,
				processedValues: [],
				errorMessage: `Model "${this.context.model}" is not available for provider ${this.context.provider.name}. Please select a valid model in settings.`,
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

		return Notice.withProgress(currentFile.name, frontmatter.name, () =>
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

			Notice.success(successMessage);
		} else {
			const error = new Error(
				`Tagging ${fileNameWithoutExt} (${frontmatter.name}) - Low reliability (${apiResponse.reliability})`
			);
			Notice.error(error);
		}
	}
}
