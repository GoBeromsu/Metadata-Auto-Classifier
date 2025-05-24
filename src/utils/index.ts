import { ProviderConfig } from './interface';

export const generateId = (): number => {
	return Date.now();
};

// Define list of special fields that need custom handling
const SPECIAL_FIELDS = ['providers', 'selectedModel'] as const;
type SpecialField = (typeof SPECIAL_FIELDS)[number];

/**
 * Merges provider information while preserving user data
 */
const mergeProvider = (
	defaultProvider: ProviderConfig,
	userProvider?: ProviderConfig
): ProviderConfig => {
	if (!userProvider) {
		return { ...defaultProvider };
	}

	// Preserve user API key
	const apiKey = userProvider.apiKey || '';

	const baseUrl =
		defaultProvider.name === 'Custom' ? userProvider.baseUrl : defaultProvider.baseUrl;

	// Update with default values while maintaining user data
	return {
		...defaultProvider,
		apiKey,
		baseUrl,
	};
};

/**
 * Deep merges default settings with user settings
 * Special fields are handled differently to preserve user data
 */
export const mergeDefaults = <T extends Record<string, any>>(
	defaults: T,
	target: Partial<T>
): T => {
	// Create a new result object to maintain immutability
	const result: Record<string, any> = { ...target };

	// Process all keys from defaults
	Object.entries(defaults).forEach(([key, defaultValue]) => {
		const isSpecialField = SPECIAL_FIELDS.includes(key as SpecialField);
		const targetValue = result[key];

		// 1. Special handling for providers
		if (key === 'providers' && Array.isArray(defaultValue) && Array.isArray(targetValue)) {
			result[key] = defaultValue.map((defaultProvider) => {
				const userProvider = targetValue.find(
					(p: ProviderConfig) => p.name === defaultProvider.name
				);
				return mergeProvider(defaultProvider, userProvider);
			});
		}
		// 2. Special handling for selectedModel (always update to default)
		else if (key === 'selectedModel') {
			result[key] = defaultValue;
		}
		// 3. Special handling for frontmatter (preserve user settings)
		else if (key === 'frontmatter' && Array.isArray(defaultValue) && Array.isArray(targetValue)) {
			// Only use default values if user has no settings
			result[key] = targetValue.length > 0 ? targetValue : [...defaultValue];
		}
		// 4. Add default value for missing keys
		else if (targetValue === undefined) {
			result[key] = defaultValue;
			console.log(`Adding missing field: ${key}`, { default: defaultValue });
		}
		// 5. Recursively merge objects (except special fields)
		else if (
			typeof defaultValue === 'object' &&
			defaultValue !== null &&
			typeof targetValue === 'object' &&
			targetValue !== null &&
			!isSpecialField &&
			!Array.isArray(defaultValue)
		) {
			result[key] = mergeDefaults(defaultValue, targetValue);
		}
		// 6. Otherwise keep user value
	});

	return result as T;
};
