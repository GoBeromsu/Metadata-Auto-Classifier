import { ProviderConfig, ProviderPreset } from './types';
import { DEFAULT_TEMPERATURE } from './constants';

const providersData = require('./providerPreset.json');

// Function to create ProviderConfig from preset
export const createProviderFromPreset = (presetId: string): ProviderConfig => {
	const preset = providersData[presetId] as ProviderPreset;
	if (!preset) {
		throw new Error(`Provider preset '${presetId}' not found`);
	}

	return {
		name: preset.name,
		apiKey: '',
		baseUrl: preset.baseUrl,
		models: [], // Start with empty models - user should add manually
		temperature: DEFAULT_TEMPERATURE,
	};
};

// Function to get default providers
export const getDefaultProviders = (): ProviderConfig[] => {
	const defaultProviderIds = ['openai'];
	return defaultProviderIds
		.map((id) => {
			try {
				return createProviderFromPreset(id);
			} catch (error) {
				console.warn(`Failed to load provider preset '${id}':`, error);
				return null;
			}
		})
		.filter((provider): provider is ProviderConfig => provider !== null);
};
