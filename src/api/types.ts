export interface Range {
        min: number;
        max: number;
}

export interface Model {
        id: string;
        name: string;
}

export interface ProviderBase {
        name: string;
        baseUrl: string;
        temperature?: number;
        models: Model[];
        apiKey: string;
}

export type ProviderConfig = ProviderBase;
export interface StructuredOutput {
	output: string[];
	reliability: number;
}

// Provider preset interface
export interface ProviderPreset extends Omit<ProviderBase, 'apiKey'> {
        presetId?: string;
        apiKeyUrl: string;
        apiKeyRequired: boolean;
        modelsList: string;
        popularModels: Model[];
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
