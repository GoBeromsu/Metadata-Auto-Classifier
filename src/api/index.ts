import { CommonNotice } from 'ui/components/common/CommonNotice';
import { RequestUrlParam } from 'obsidian';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { Anthropic } from './Anthropic';
import { Custom } from './Custom';
import { OpenAI } from './OpenAI';
import { OpenRouter } from './OpenRouter';
import { Gemini } from './Gemini';
import { DeepSeek } from './DeepSeek';

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
	try {
		const providerInstance = getProvider(selectedProvider.name);
		const response = await providerInstance.callAPI(
			systemRole,
			promptTemplate,
			selectedProvider,
			selectedModel
		);
		return response;
	} catch (error) {
		CommonNotice.showError(error as Error, 'API Request');
		return {
			output: [],
			reliability: 0,
		};
	}
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

export const getRequestParam = (
	url: string,
	headers: Record<string, string>,
	body?: string | ArrayBuffer
): RequestUrlParam => {
	return {
		url,
		method: 'POST',
		headers,
		body,
	};
};
