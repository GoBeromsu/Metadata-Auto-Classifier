import { Notice, TFile } from 'obsidian';
import { ErrorHandler } from '../error/errorHandler';

import { AIFactory } from '.';

import FrontMatterHandler from 'FrontMatterHandler';
import { Provider } from '../types/APIInterface';

export class APIHandler {
	constructor(private manifest: { name: string }, private frontmatterHandler: FrontMatterHandler) {}

	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: Provider,
		currentFile: TFile,
		key: string,
		count: number
	): Promise<void> {
		try {
			const providerInstance = AIFactory.getProvider(selectedProvider.name);
			const responseRaw = await providerInstance.callAPI(
				chatRole,
				promptTemplate,
				selectedProvider
			);
			const { resOutput, resReliability } = this.processAPIResponse(responseRaw);

			if (!resOutput || resReliability === undefined) {
				ErrorHandler.handle(
					new Error('responseRaw is null or reliability is undefined'),
					`Target Frontmatter ${key}`
				);
				return;
			}

			if (resReliability <= 0.2) {
				new Notice(`⛔ ${this.manifest.name}: Response has low reliability (${resReliability})`);
				return;
			}

			const preprocessedValues = resOutput.split(',').map((item) => item.trim());
			await this.frontmatterHandler.insertToFrontMatter(
				currentFile,
				key,
				preprocessedValues,
				false
			);
			new Notice(`✅ ${preprocessedValues.length} ${key} added: ${preprocessedValues.join(', ')}`);
		} catch (error) {
			ErrorHandler.handle(error as Error, `Target Frontmatter ${key}`);
		}
	}

	private processAPIResponse(responseRaw: string): {
		resOutput: string | null;
		resReliability: number | undefined;
	} {
		try {
			const response = JSON.parse(responseRaw);
			const cleanOutput = response.output.map((item: string) =>
				item.trim().replace(/^["'\s]+|["'\s]+$/g, '')
			);
			return {
				resOutput: cleanOutput.join(', '),
				resReliability: response.reliability,
			};
		} catch (error) {
			ErrorHandler.handle(
				error as Error,
				`⛔ ${this.manifest.name}: Output format error (output: ${responseRaw})`
			);
			return { resOutput: null, resReliability: undefined };
		}
	}
}
