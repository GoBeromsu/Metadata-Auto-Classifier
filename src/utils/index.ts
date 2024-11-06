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
export const mergeDefaults = (defaults: any, target: any): any => {
	Object.entries(defaults).forEach(([key, value]) => {
		if (!(key in target)) {
			target[key] = value;
			console.log(`Adding missing field: ${key}`, { default: value });
		} else if (typeof value === 'object' && value !== null) {
			target[key] = mergeDefaults(value, target[key]);
		}
	});
	return target;
};
