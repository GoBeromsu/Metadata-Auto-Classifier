import type { ProviderPreset } from 'api/types';

// Import provider presets data
const providerPresetsData = require('../api/providerPreset.json');

export const generateId = (): number => {
	return Date.now();
};

/**
 * Get all provider presets with type safety
 * Excludes the version field and returns only valid ProviderPreset objects
 */
export const getProviderPresets = (): ProviderPreset[] => {
	return Object.entries(providerPresetsData).map(([key, preset]) => ({
		...(preset as ProviderPreset),
		id: key,
	}));
};

/**
 * Get a specific provider preset by ID
 */
export const getProviderPreset = (providerName: string): ProviderPreset => {
	return providerPresetsData[providerName] as ProviderPreset;
};

/**
 * Find matching preset for an existing provider config
 * Matches by baseUrl or name
 */
export const findMatchingPreset = (providerConfig: { baseUrl: string; name: string }): string => {
	const presets = getProviderPresets();
	const matchingPreset = presets.find(
		(preset) => preset.baseUrl === providerConfig.baseUrl || preset.name === providerConfig.name
	);
	return matchingPreset?.id || 'custom';
};
