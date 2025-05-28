import { ProviderConfig } from './types';

// Common Constants (reused multiple times)
export const COMMON_CONSTANTS = {
	DEFAULT_MAX_TOKENS: 32000,
	DEFAULT_RELIABILITY_MIN: 0,
	DEFAULT_RELIABILITY_MAX: 1,
	DEFAULT_TEMPERATURE: 0.7,
	VERIFY_CONNECTION_SYSTEM_PROMPT: 'You are a test system. You must respond with valid JSON.',
	VERIFY_CONNECTION_USER_PROMPT: 'Return a JSON object containing {"output": [], "reliability": 0}',
};

export const DEFAULT_PROVIDER: ProviderConfig = {
	name: 'OpenAI',
	apiKey: '',
	baseUrl: 'https://api.openai.com/v1/chat/completions',
	models: [
		{
			name: 'gpt-4.1-mini',
			displayName: 'GPT-4.1 Mini',
		},
	],
	temperature: COMMON_CONSTANTS.DEFAULT_TEMPERATURE,
};

// Common Schema Base (reused by OpenAI, OpenRouter, Gemini)
export const COMMON_SCHEMA_BASE = {
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
} as const;

// Anthropic Configuration
export const ANTHROPIC_TOOL_CONFIG = {
	name: 'classify_content',
	description: 'Classify content and return structured metadata',
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
				minimum: COMMON_CONSTANTS.DEFAULT_RELIABILITY_MIN,
				maximum: COMMON_CONSTANTS.DEFAULT_RELIABILITY_MAX,
				description: 'Confidence score from 0 to 100',
			},
		},
		required: ['output', 'reliability'],
	},
};

// OpenAI Configuration
export const OPENAI_STRUCTURE_OUTPUT = {
	type: 'json_schema',
	json_schema: {
		name: 'metadata_classifier',
		schema: COMMON_SCHEMA_BASE,
		strict: true,
	},
};

// OpenRouter Configuration
export const OPENROUTER_STRUCTURE_OUTPUT = {
	type: 'json_schema',
	json_schema: {
		name: 'metadata_classifier',
		schema: COMMON_SCHEMA_BASE,
		strict: true,
	},
};

// LMStudio Configuration
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

// Gemini Configuration
export const GEMINI_STRUCTURE_OUTPUT = {
	response_mime_type: 'application/json',
	response_schema: COMMON_SCHEMA_BASE,
};
