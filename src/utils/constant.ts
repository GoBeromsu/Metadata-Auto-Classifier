import { AutoClassifierSettings } from 'ui';
import { DEFAULT_TAG_SETTING } from 'ui/Tag';
import { ProviderConfig } from './interface';

export const DEFAULT_FRONTMATTER_SETTING = {
	name: '',
	count: 1,
	refs: [],
};
const DEFAULT_TEMPERATURE = 0.7;
// Default provider settings
export enum AIProvider {
	OpenAI = 'OpenAI',
	Custom = 'Custom',
}

export enum DefaultProvider {
	NAME = 'OpenAI',
	BASE_URL = 'https://api.openai.com/v1',
}
// OpenAI model names

export enum OpenAIModelName {
	GPT_3_5_TURBO = 'gpt-3.5-turbo',
	GPT_4_OMNI = 'gpt-4o',
	GPT_4_MINI = 'gpt-4o-mini',
}
// Default OpenAI provider configuration
const DEFAULT_OPENAI_PROVIDER: ProviderConfig = {
	name: DefaultProvider.NAME,
	apiKey: '',
	baseUrl: DefaultProvider.BASE_URL,
	models: [
		{ name: OpenAIModelName.GPT_3_5_TURBO },
		{ name: OpenAIModelName.GPT_4_OMNI },
		{ name: OpenAIModelName.GPT_4_MINI },
	],

	lastTested: null,
	testResult: null,
	temperature: DEFAULT_TEMPERATURE,
};
const CUSTOM_PROVIDER: ProviderConfig = {
	name: AIProvider.Custom,
	apiKey: '',
	baseUrl: '',
	models: [],
	lastTested: null,
	testResult: null,
};
// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: [DEFAULT_OPENAI_PROVIDER, CUSTOM_PROVIDER],
	selectedProvider: AIProvider.OpenAI,
	selectedModel: OpenAIModelName.GPT_4_OMNI,
	frontmatter: [DEFAULT_TAG_SETTING],
};
