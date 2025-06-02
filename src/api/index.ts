import type { RequestUrlParam } from 'obsidian';
import { requestUrl } from 'obsidian';
import { PROVIDER_NAMES } from '../utils';
import { COMMON_CONSTANTS } from './constants';
import { Anthropic } from './providers/Anthropic';
import { Custom } from './providers/Custom';
import { DeepSeek } from './providers/DeepSeek';
import { Gemini } from './providers/Gemini';
import { LMStudio } from './providers/LMStudio';
import { Ollama } from './providers/Ollama';
import { OpenAI } from './providers/OpenAI';
import { OpenRouter } from './providers/OpenRouter';
import type { APIProvider, ProviderConfig, StructuredOutput } from './types';

export const getProvider = (providerName: string): APIProvider => {
	switch (providerName) {
		case PROVIDER_NAMES.OPENAI:
			return new OpenAI();
		case PROVIDER_NAMES.ANTHROPIC:
			return new Anthropic();
		case PROVIDER_NAMES.OPENROUTER:
			return new OpenRouter();
		case PROVIDER_NAMES.GEMINI:
			return new Gemini();
		case PROVIDER_NAMES.DEEPSEEK:
			return new DeepSeek();
		case PROVIDER_NAMES.LMSTUDIO:
			return new LMStudio();
		case PROVIDER_NAMES.OLLAMA:
			return new Ollama();
		default:
			return new Custom();
	}
};

export const testModel = async (
	providerConfig: ProviderConfig,
	modelName: string
): Promise<boolean> => {
	try {
		const apiProvider = getProvider(providerConfig.name);
		await apiProvider.callAPI(
			COMMON_CONSTANTS.VERIFY_CONNECTION_SYSTEM_PROMPT,
			COMMON_CONSTANTS.VERIFY_CONNECTION_USER_PROMPT,
			providerConfig,
			modelName
		);
		return true;
	} catch (error) {
		return false;
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
		throw new Error(`Network error: ${error}`);
	}

	if (response.status >= 500) {
		throw new Error(`Server error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	if (response.status >= 400) {
		throw new Error(`Client error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	return response.json;
};
