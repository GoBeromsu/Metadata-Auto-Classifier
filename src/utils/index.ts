import { AIProvider, CUSTOM_PROVIDER, OPENAI_PROVIDER } from './constant';

export const generateId = (): number => {
	return Date.now();
};

export const getDefaultEndpoint = (providerName: string): string => {
	switch (providerName) {
		case AIProvider.OpenAI:
			return OPENAI_PROVIDER.endpoint;
		case AIProvider.Custom:
			return CUSTOM_PROVIDER.endpoint;
		default:
			return CUSTOM_PROVIDER.endpoint;
	}
};
