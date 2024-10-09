import { AIFactory } from '.';
import { ErrorHandler } from '../error/errorHandler';
import { Provider, StructuredOutput } from '../types/apiInterface';

export class APIHandler {
	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: Provider
	): Promise<StructuredOutput | null> {
		try {
			const providerInstance = AIFactory.getProvider(selectedProvider.name);
			const response = await providerInstance.callAPI(chatRole, promptTemplate, selectedProvider);
			return this.processAPIResponse(response);
		} catch (error) {
			ErrorHandler.handle(error as Error, `API Request Error`);
			return null;
		}
	}

	private processAPIResponse(response: StructuredOutput): StructuredOutput | null {
		try {
			return {
				output: response.output.map((item) => item.trim()),
				reliability: response.reliability,
			};
		} catch (error) {
			ErrorHandler.handle(
				error as Error,
				`⛔ Output format error (output: ${JSON.stringify(response)})`
			);
			return null;
		}
	}
}
