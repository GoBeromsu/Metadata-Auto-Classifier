import { COMMON_CONSTANTS } from '../constants';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';
import { UnifiedProvider } from './UnifiedProvider';

// Re-export for backward compatibility
export { UnifiedProvider } from './UnifiedProvider';
export { sendRequest } from './request';

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
