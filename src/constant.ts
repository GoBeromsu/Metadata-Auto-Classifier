import { AutoClassifierSettings } from 'settings';
import { Provider } from 'types/apiInterface';

const DEFAULT_TEMPERATURE = 0.7;

// Default provider settings
export enum DefaultProvider {
	NAME = 'OpenAI',
	BASE_URL = 'https://api.openai.com/v1',
}

// OpenAI model names
export enum OpenAIModelName {
	GPT_3_5_TURBO = 'gpt-3.5-turbo',
	GPT_4 = 'gpt-4',
	GPT_4_32K = 'gpt-4-32k',
	GPT_4_OMNI = 'gpt-4-omni',
	GPT_4_MINI = 'gpt-4-mini',
}

// Default OpenAI provider configuration
const DEFAULT_OPENAI_PROVIDER: Provider = {
	name: DefaultProvider.NAME,
	apiKey: '',
	baseUrl: DefaultProvider.BASE_URL,
	models: [
		{ name: OpenAIModelName.GPT_3_5_TURBO },
		{ name: OpenAIModelName.GPT_4 },
		{ name: OpenAIModelName.GPT_4_32K },
		{ name: OpenAIModelName.GPT_4_OMNI },
		{ name: OpenAIModelName.GPT_4_MINI },
	],

	lastTested: null,
	testResult: null,
	temperature: DEFAULT_TEMPERATURE,
};
// Default frontmatter setting
export const DEFAULT_FRONTMATTER_SETTING = {
	name: '',
	count: 1,
	refs: [],
};

// Default tag settings
export const DEFAULT_TAG_SETTING: FrontmatterTemplate = {
	id: 0,
	name: 'tags',
	refs: [],
	count: 5,
};
export interface FrontmatterTemplate {
	id: number;
	name: string;
	count: number;
	refs: string[];
}

// Default settings for the Auto Classifier plugin
export const DEFAULT_SETTINGS: AutoClassifierSettings = {
	providers: [DEFAULT_OPENAI_PROVIDER],
	selectedProvider: DefaultProvider.NAME,
	selectedModel: OpenAIModelName.GPT_4_OMNI,
	frontmatter: [DEFAULT_TAG_SETTING],
};
