import { ErrorHandler } from 'error/ErrorHandler';
import { AIProvider } from 'utils/constant';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { OpenAI } from './OpenAI';
import { Custom } from './Custom';

interface ApiTestResult {
	success: boolean;
	message: string;
}

export const getProvider = (providerName: string): APIProvider => {
	switch (providerName) {
		case AIProvider.OpenAI:
			return new OpenAI();
		case AIProvider.Custom:
			return new Custom();
		default:
			throw new Error(`Unknown AI provider: ${providerName}`);
	}
};

export const processAPIRequest = async (
	chatRole: string,
	promptTemplate: string,
	selectedProvider: ProviderConfig,
	selectedModel: string
): Promise<StructuredOutput> => {
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
};

export const validateAPIKey = async (provider: ProviderConfig): Promise<ApiTestResult> => {
	const aiProvider: APIProvider = getProvider(provider.name);
	const isValid = await aiProvider.verifyConnection(provider);

	const message = isValid
		? `Last tested: ${new Date().toLocaleString()} - Success! API is working.`
		: `Last tested: ${new Date().toLocaleString()} - Error: API is not working.`;

	return {
		success: isValid,
		message,
	};
};

export const getHeaders = (apiKey?: string): Record<string, string> => {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}

	return headers;
};
