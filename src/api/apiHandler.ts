import ErrorHandler from '../error/ErrorHandler';
import { Provider } from '../types/interface';
import { StructuredOutput } from './interface';
import { AIFactory } from './OpenAIProvider';
export class APIHandler {
	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: Provider
	): Promise<StructuredOutput | null> {
		try {
			const providerInstance = AIFactory.getProvider(selectedProvider.name);
			const response = await providerInstance.callAPI(chatRole, promptTemplate, selectedProvider);
			return response;
		} catch (error) {
			ErrorHandler.handle(error as Error, `API Request Error`);
			return null;
		}
	}

	// This function is no longer used because:
	// 1. We now use OpenAI's JSON format API, which provides a consistent structure
	// 2. Error handling is no longer necessary due to the reliable JSON format
	// 3. The trimming of output items is now handled elsewhere in the codebase
	private processAPIResponse(response: StructuredOutput): StructuredOutput | null {
		try {
			console.log(response.output.map((item) => item.trim()));
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
