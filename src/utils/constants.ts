import { AutoClassifierSettings } from 'ui';
import { FrontmatterTemplate, ProviderConfig } from './interface';
import { DEFAULT_TASK_TEMPLATE } from './templates';

const providersData = require('../data/providers.json');

export const DEFAULT_FRONTMATTER_SETTING = {
	name: '',
	count: { min: 1, max: 1 },
	refs: [],
	overwrite: false,
	linkType: 'WikiLink' as const,
	customQuery: '',
};

const DEFAULT_TEMPERATURE = 0.7;

// Provider preset interface
interface ProviderPreset {
	id: string;
	name: string;
	apiKeyUrl: string;
	apiKeyRequired: boolean;
	modelsList: string;
	baseUrl: string;
	popularModels: Array<{ id: string; name: string }>;
}

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

export const DEFAULT_TAG_SETTING: FrontmatterTemplate = {
	id: 0,
	name: 'tags',
	refs: [],
	count: { min: 1, max: 5 },
	overwrite: false,
	linkType: 'Normal',
	customQuery: '',
};

// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: getDefaultProviders(), // Restore default providers with openai
	selectedProvider: '',
	selectedModel: '',
	frontmatter: [DEFAULT_TAG_SETTING],
	classificationRule: DEFAULT_TASK_TEMPLATE,
};

export const LMSTUDIO_STRUCTURE_OUTPUT = {
	type: 'json_schema',
	json_schema: {
		name: 'structured_output',
		strict: true,
		schema: {
			type: 'object',
			properties: {
				output: {
					type: 'array',
					items: { type: 'string' },
				},
				reliability: {
					type: 'number',
				},
			},
			required: ['output', 'reliability'],
		},
	},
};

export const OPENAI_STRUCTURE_OUTPUT = {
	type: 'json_schema',
	json_schema: {
		name: 'metadata_classifier',
		schema: {
			type: 'object',
			properties: {
				output: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of classified tags or categories',
				},
				reliability: {
					type: 'number',
					description: 'A number between 0 and 1 indicating confidence in the classification',
				},
			},
			required: ['output', 'reliability'],
			additionalProperties: false,
		},
		strict: true,
	},
};

export const OPENROUTER_STRUCTURE_OUTPUT = {
	type: 'json_schema',
	json_schema: {
		name: 'metadata_classifier',
		schema: {
			type: 'object',
			properties: {
				output: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of classified tags or categories',
				},
				reliability: {
					type: 'number',
					description: 'A number between 0 and 1 indicating confidence in the classification',
				},
			},
			required: ['output', 'reliability'],
			additionalProperties: false,
		},
		strict: true,
	},
};

// Gemini Structured Output Configuration
export const GEMINI_STRUCTURE_OUTPUT = {
	response_mime_type: 'application/json',
	response_schema: {
		type: 'object',
		properties: {
			output: {
				type: 'array',
				items: { type: 'string' },
				description: 'Array of classified tags or categories',
			},
			reliability: {
				type: 'number',
				description: 'A number between 0 and 1 indicating confidence in the classification',
			},
		},
		required: ['output', 'reliability'],
		additionalProperties: false,
	},
};

// API Common Constants
export const API_CONSTANTS = {
	DEFAULT_MAX_TOKENS: 32000,
	DEFAULT_RELIABILITY_MIN: 0,
	DEFAULT_RELIABILITY_MAX: 1,
	ANTHROPIC_VERSION: '2023-06-01',
	OPENROUTER_TITLE: 'Metadata Auto Classifier',
	VERIFY_CONNECTION_SYSTEM_PROMPT: 'You are a test system. You must respond with valid JSON.',
	VERIFY_CONNECTION_USER_PROMPT: 'Return a JSON object containing {"output": [], "reliability": 0}',
	ANTHROPIC_TOOL_NAME: 'classify_content',
	ANTHROPIC_TOOL_DESCRIPTION: 'Classify content and return structured metadata',
};

// Anthropic Tool Configuration
export const ANTHROPIC_TOOL_CONFIG = {
	name: API_CONSTANTS.ANTHROPIC_TOOL_NAME,
	description: API_CONSTANTS.ANTHROPIC_TOOL_DESCRIPTION,
	input_schema: {
		type: 'object',
		properties: {
			output: {
				type: 'array',
				items: { type: 'string' },
				description: 'Array of classification tags or metadata values',
			},
			reliability: {
				type: 'number',
				minimum: API_CONSTANTS.DEFAULT_RELIABILITY_MIN,
				maximum: API_CONSTANTS.DEFAULT_RELIABILITY_MAX,
				description: 'Confidence score from 0 to 100',
			},
		},
		required: ['output', 'reliability'],
	},
};
