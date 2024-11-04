import ErrorHandler from '../error/ErrorHandler';
import { Provider } from '../types/interface';
import AIFactory from './AIFactory';
import { StructuredOutput } from './interface';

export interface APITestResult {
	success: boolean;
	timestamp: Date;
	message: string;
}

export default class APIHandler {
	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: Provider,
		selectedModel: string
	): Promise<StructuredOutput> {
		try {
			const providerInstance = AIFactory.getProvider(selectedProvider.name);
			const response = await providerInstance.callAPI(
				chatRole,
				promptTemplate,
				selectedProvider,
				selectedModel
			);
			return response;
		} catch (error) {
			ErrorHandler.handle(error as Error, `API Request Error`);
			return {
				output: [],
				reliability: 0,
			};
		}
	}

	async testAPIKey(provider: Provider): Promise<APITestResult> {
		try {
			const aiProvider = AIFactory.getProvider(provider.name);
			const result = await aiProvider.testAPI(provider);

			return {
				success: result,
				timestamp: new Date(),
				message: result ? 'Success! API is working.' : 'Error: API is not working.',
			};
		} catch (error) {
			ErrorHandler.handle(error as Error, 'API Key Testing');
			return {
				success: false,
				timestamp: new Date(),
				message: 'Error: API is not working.',
			};
		}
	}
}
