export interface ProviderConfig {
	name: string;
	apiKey: string;
	baseUrl: string;
	models: Model[];
	temperature?: number;
}

export interface Model {
	name: string;
	displayName: string;
}
export interface StructuredOutput {
	output: string[];
	reliability: number;
}

// Provider preset interface
export interface ProviderPreset {
	id: string;
	name: string;
	apiKeyUrl: string;
	apiKeyRequired: boolean;
	modelsList: string;
	baseUrl: string;
	temperature?: number;
	popularModels: Array<{ id: string; name: string }>;
}

export interface APIProvider {
	callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput>;

	buildHeaders(apiKey: string): Record<string, string>;
	processApiResponse(responseData: any): StructuredOutput;
}
