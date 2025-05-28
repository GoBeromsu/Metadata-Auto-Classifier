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

export const DEFAULT_TEMPERATURE = 0.7;

// OpenAI Structured Output Configuration
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

// OpenRouter Structured Output Configuration
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

// LMStudio Structured Output Configuration
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
