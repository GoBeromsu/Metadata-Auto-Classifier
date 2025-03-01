import { TFile } from 'obsidian';

export interface FrontmatterTemplate {
	id: number;
	name: string;
	count: number;
	refs: string[];
	overwrite: boolean;
}
export interface ProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	endpoint: string;
	models: Model[];
	lastTested: Date | null;
	testResult: boolean | null;
	temperature?: number;
}

interface Model {
	name: string;
}
export interface FrontMatter {
	[key: string]: string[];
}
export type ProcessFrontMatterFn = (
	file: TFile,
	fn: (frontmatter: FrontMatter) => void
) => Promise<void>;

export interface InsertFrontMatterParams {
	file: TFile;
	key: string;
	value: string[];
	overwrite: boolean;
}
export interface StructuredOutput {
	output: string[];
	reliability: number;
}

export interface APIProvider {
	callAPI(
		system_role: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput>;

	verifyConnection(provider: ProviderConfig): Promise<boolean>;
}
