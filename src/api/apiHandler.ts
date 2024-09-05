import { Notice, TFile } from 'obsidian';

import { AIFactory } from '.';
import { MetaDataManager } from '../metaDataManager';
import { Provider } from '../types/APIInterface';

export class APIHandler {
	constructor(private manifest: { name: string }, private metaDataManager: MetaDataManager) {}

	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: Provider,
		currentFile: TFile,
		key: string,
		count: number
	): Promise<void> {
		const provider = AIFactory.getProvider(selectedProvider.name);
		try {
			const responseRaw = await provider.callAPI(chatRole, promptTemplate, selectedProvider);
			console.log('Raw API response:', responseRaw);
			const { resOutput, resReliability } = this.processAPIResponse(responseRaw);
			console.log('Processed API response:', { resOutput, resReliability });

			if (!resOutput || resReliability === undefined) {
				return;
			}

			if (resReliability <= 0.2) {
				new Notice(`⛔ ${this.manifest.name}: Response has low reliability (${resReliability})`);
				return;
			}

			const preprocessedValues = resOutput.split(',').map((item) => item.trim());
			await this.metaDataManager.insertToFrontMatter(currentFile, key, preprocessedValues, false);
			new Notice(`✅ ${preprocessedValues.length} ${key} added: ${preprocessedValues.join(', ')}`);
		} catch (error) {
			console.error(`Error occurred while classifying and adding ${key}:`, error);
			new Notice(`An error occurred while classifying and adding ${key}.`);
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
			console.error('Error parsing API response:', error);
			new Notice(`⛔ ${this.manifest.name}: Output format error (output: ${responseRaw})`);
			return { resOutput: null, resReliability: undefined };
		}
	}
}
