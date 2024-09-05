import { AutoClassifierSettings } from 'setting';
import { Frontmatter, Model, Provider } from 'types/APIInterface';

export const DEFAULT_MAX_TOKEN = 2048;
const DEFAULT_TEMPERATURE = 0.7;

// Default provider settings
export enum DefaultProvider {
	NAME = 'OpenAI',
	BASE_URL = 'https://api.openai.com/v1',
	MODEL = 'gpt-3.5-turbo',
}

// Default tag settings
export const DEFAULT_TAG_SETTING: Frontmatter = {
	name: 'tags',
	refs: [],
	allowMultiple: true,
	count: 5,
};

// Default OpenAI provider configuration
const DEFAULT_OPENAI_PROVIDER: Provider = {
	name: DefaultProvider.NAME,
	apiKey: '',
	baseUrl: DefaultProvider.BASE_URL,
	models: [
		{
			name: DefaultProvider.MODEL,
		} as Model,
	],
	maxTokens: DEFAULT_MAX_TOKEN,
	lastTested: null,
	testResult: null,
	temperature: DEFAULT_TEMPERATURE,
};

// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: [DEFAULT_OPENAI_PROVIDER],
	selectedProvider: DefaultProvider.NAME,
	selectedModel: DefaultProvider.MODEL,
	frontmatter: [DEFAULT_TAG_SETTING],
};
