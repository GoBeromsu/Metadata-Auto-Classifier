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
	const entries = Object.entries(providerPresetsData).filter(([key]) => key !== 'version');
	return entries.map(([key, preset]) => ({
		...(preset as ProviderPreset),
		id: key, // Ensure id matches the key from JSON
	}));
};

/**
 * Get a specific provider preset by ID
 */
export const getProviderPresetById = (id: string): ProviderPreset | undefined => {
	if (id === 'version' || !providerPresetsData[id]) {
		return undefined;
	}
	return {
		...(providerPresetsData[id] as ProviderPreset),
		id,
	};
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
