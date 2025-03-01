import { AutoClassifierSettings } from 'ui';
import { FrontmatterTemplate, ProviderConfig } from './interface';

export const DEFAULT_FRONTMATTER_SETTING = {
	name: '',
	count: 1,
	refs: [],
	overwrite: false,
};
const DEFAULT_TEMPERATURE = 0.7;
// Default provider settings
export enum AIProvider {
	OpenAI = 'OpenAI',
	Custom = 'Custom',
}

export enum OpenAIModelName {
	GPT_4_5_PREVIEW = 'gpt-4.5-preview-2025-02-27',
	O3_MINI_2025 = 'o3-mini-2025-1-31',
	GPT_4O_MINI_2024 = 'gpt-4o-mini-2024-07-18',
}
// Default OpenAI provider configuration
export const OPENAI_PROVIDER: ProviderConfig = {
	name: AIProvider.OpenAI,
	apiKey: '',
	baseUrl: 'https://api.openai.com',
	endpoint: '/v1/chat/completions',
	models: [
		{ name: OpenAIModelName.GPT_4_5_PREVIEW },
		{ name: OpenAIModelName.O3_MINI_2025 },
		{ name: OpenAIModelName.GPT_4O_MINI_2024 },
	],

	lastTested: null,
	testResult: null,
	temperature: DEFAULT_TEMPERATURE,
};
export const CUSTOM_PROVIDER: ProviderConfig = {
	name: AIProvider.Custom,
	apiKey: '',
	baseUrl: '',
	endpoint: '/v1/chat/completions',
	models: [
		{
			name: '',
		},
	],
	lastTested: null,
	testResult: null,
};
export const DEFAULT_TAG_SETTING: FrontmatterTemplate = {
	id: 0,
	name: 'tags',
	refs: [],
	count: 5,
	overwrite: false,
};

// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: [OPENAI_PROVIDER, CUSTOM_PROVIDER],
	selectedProvider: AIProvider.OpenAI,
	selectedModel: OpenAIModelName.GPT_4O_MINI_2024,
	frontmatter: [DEFAULT_TAG_SETTING],
}; // Default tag settings

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
