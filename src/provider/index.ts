import type { RequestUrlParam } from 'obsidian';
import { requestUrl } from 'obsidian';
import { COMMON_CONSTANTS } from '../constants';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';
import { UnifiedProvider } from './UnifiedProvider';

// Re-export for backward compatibility in tests
export { UnifiedProvider } from './UnifiedProvider';

// Single instance of UnifiedProvider for all providers
const unifiedProvider = new UnifiedProvider();

export const getProvider = (): APIProvider => {
	return unifiedProvider;
};

export const testModel = async (
	providerConfig: ProviderConfig,
	modelName: string
): Promise<boolean> => {
	const apiProvider = getProvider();
	await apiProvider.callAPI(
		COMMON_CONSTANTS.VERIFY_CONNECTION_SYSTEM_PROMPT,
		COMMON_CONSTANTS.VERIFY_CONNECTION_USER_PROMPT,
		providerConfig,
		modelName
	);
	return true;
};

export const processAPIRequest = async (
	systemRole: string,
	promptTemplate: string,
	selectedProvider: ProviderConfig,
	selectedModel: string
): Promise<StructuredOutput> => {
	const providerInstance = getProvider();
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
): Promise<unknown> => {
	const requestParam: RequestUrlParam = getRequestParam(baseUrl, headers, data);
	let response: { status: number; text: string; json: unknown };

	try {
		response = await requestUrl(requestParam);
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(String(error));
	}

	if (response.status >= 500) {
		throw new Error(`Server error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	if (response.status >= 400) {
		throw new Error(`Client error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	return response.json;
};
