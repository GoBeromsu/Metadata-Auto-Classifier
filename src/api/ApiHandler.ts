import { ErrorHandler } from '../error/ErrorHandler';

import { getProvider } from './AiFactory';

import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export interface ApiTestResult {
	success: boolean;
	timestamp: Date;
	message: string;
}

export class ApiHandler {
	async processAPIRequest(
		chatRole: string,
		promptTemplate: string,
		selectedProvider: ProviderConfig,
		selectedModel: string
	): Promise<StructuredOutput> {
		try {
			const providerInstance = getProvider(selectedProvider.name);
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

	async testAPIKey(provider: ProviderConfig): Promise<ApiTestResult> {
		try {
			const aiProvider: APIProvider = getProvider(provider.name);
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
