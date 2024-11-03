export interface Provider {
	name: string;
	apiKey: string;
	baseUrl: string;
	models: Model[];
	lastTested: Date | null;
	testResult: boolean | null;
	temperature: number;
}

export interface Model {
	name: string;
}
