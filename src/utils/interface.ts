import { TFile } from 'obsidian';

export interface FrontmatterTemplate {
	id: number;
	name: string;
	count: number;
	refs: string[];
	overwrite: boolean;
	linkType: 'WikiLink' | 'Normal';
	customQuery: string;
}
export interface ProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	models: Model[];
	temperature?: number;
	customPromptTemplate?: string;
}

interface Model {
	name: string;
	displayName?: string;
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
	linkType?: 'Normal' | 'WikiLink';
}
export interface StructuredOutput {
	output: string[];
	reliability: number;
}

export interface APIProvider {
	callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput>;

	verifyConnection(provider: ProviderConfig): Promise<boolean>;
}

export interface ModelInfo {
	name: string;
	displayName?: string;
}
