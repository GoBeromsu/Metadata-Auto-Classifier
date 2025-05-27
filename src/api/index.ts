import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { Anthropic } from './Anthropic';
import { Custom } from './Custom';
import { DeepSeek } from './DeepSeek';
import { Gemini } from './Gemini';
import { OpenAI } from './OpenAI';
import { OpenRouter } from './OpenRouter';
import { ApiError } from './ApiError';

export const getProvider = (providerName: string): APIProvider => {
	switch (providerName) {
		case 'OpenAI':
			return new OpenAI();
		case 'Anthropic':
			return new Anthropic();
		case 'Custom':
			return new Custom();
		case 'OpenRouter':
			return new OpenRouter();
		case 'Gemini':
			return new Gemini();
		case 'DeepSeek':
			return new DeepSeek();
		default:
			throw new Error(`Unknown AI provider: ${providerName}`);
	}
};

export const processAPIRequest = async (
	systemRole: string,
	promptTemplate: string,
	selectedProvider: ProviderConfig,
	selectedModel: string
): Promise<StructuredOutput> => {
	const providerInstance = getProvider(selectedProvider.name);
	const response = await providerInstance.callAPI(
		systemRole,
		promptTemplate,
		selectedProvider,
		selectedModel
	);
	return response;
};

/**
 * Creates standardized RequestUrlParam objects with enforced POST method
 * Implements convention-over-configuration to ensure API call consistency
 */
const getRequestParam = (
	url: string,
	headers: Record<string, string>,
	body: object
): RequestUrlParam => {
	return {
		url,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	};
};

export const sendRequest = async (
	baseUrl: string,
	headers: Record<string, string>,
	data: object
): Promise<any> => {
	const requestParam: RequestUrlParam = getRequestParam(baseUrl, headers, data);
	let response: any;

	try {
		response = await requestUrl(requestParam);
	} catch (error) {
		throw new ApiError(`${error}`);
	}

	if (response.status >= 500) {
		throw new ApiError(`Server error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	if (response.status >= 400) {
		throw new ApiError(`Client error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	return response.json;
};
