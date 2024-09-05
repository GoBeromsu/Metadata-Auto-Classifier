export interface Provider {
	name: string;
	apiKey: string;
	baseUrl: string;
	models: Model[];
	maxTokens: number;
	lastTested: Date | null;
	testResult: boolean | null;
	temperature: number;
}

export interface Model {
	name: string;
}

export interface APIProvider {
	callAPI(
		system_role: string,
		user_prompt: string,
		provider: Provider,
		temperature?: number,
		top_p?: number,
		frequency_penalty?: number,
		presence_penalty?: number
	): Promise<string>;

	testAPI(provider: Provider): Promise<boolean>;
}
