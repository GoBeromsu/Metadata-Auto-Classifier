import { AutoClassifierSettings } from 'ui';
import { Provider } from '../types/interface';
import { DEFAULT_TAG_SETTING } from 'ui/Tag';

const DEFAULT_TEMPERATURE = 0.7;

// Default provider settings
export enum DefaultProvider {
	NAME = 'OpenAI',
	BASE_URL = 'https://api.openai.com/v1',
}

// API Endpoints
export enum APIEndpoints {
	CHAT_COMPLETIONS = '/chat/completions',
}

// OpenAI model names
export enum OpenAIModelName {
	GPT_3_5_TURBO = 'gpt-3.5-turbo',
	GPT_4_OMNI = 'gpt-4o',
	GPT_4_MINI = 'gpt-4o-mini',
}

// Default OpenAI provider configuration
const DEFAULT_OPENAI_PROVIDER: Provider = {
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
// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: [DEFAULT_OPENAI_PROVIDER],
	selectedProvider: DefaultProvider.NAME,
	selectedModel: OpenAIModelName.GPT_4_OMNI,
	frontmatter: [DEFAULT_TAG_SETTING],
};
