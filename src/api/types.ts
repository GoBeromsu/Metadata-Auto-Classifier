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

export interface APIProvider {
	callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput>;

	verifyConnection(provider: ProviderConfig): Promise<boolean>;
	buildHeaders(apiKey: string): Record<string, string>;
	processApiResponse(responseData: any): StructuredOutput;
}
