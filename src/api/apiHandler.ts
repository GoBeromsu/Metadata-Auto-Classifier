import { AIFactory } from '.';
import { ErrorHandler } from '../error/errorHandler';
import { Provider } from '../types/APIInterface';

export class APIHandler {
	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: Provider
	): Promise<{ output: string[]; reliability: number } | null> {
		try {
			const providerInstance = AIFactory.getProvider(selectedProvider.name);
			const responseRaw = await providerInstance.callAPI(
				chatRole,
				promptTemplate,
				selectedProvider
			);
			return this.processAPIResponse(responseRaw);
		} catch (error) {
			ErrorHandler.handle(error as Error, `API Request Error`);
			return null;
		}
	}

	private processAPIResponse(
		responseRaw: string
	): { output: string[]; reliability: number } | null {
		try {
			const response = JSON.parse(responseRaw);
			const cleanOutput = response.output.map((item: string) =>
				item.trim().replace(/^["'\s]+|["'\s]+$/g, '')
			);
			return {
				output: cleanOutput,
				reliability: response.reliability,
			};
		} catch (error) {
			ErrorHandler.handle(error as Error, `⛔ Output format error (output: ${responseRaw})`);
			return null;
		}
	}
}
