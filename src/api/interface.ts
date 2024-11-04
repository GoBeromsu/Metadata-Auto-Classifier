import { Provider } from '../types/interface';

export interface StructuredOutput {
	output: string[];
	reliability: number;
}

export interface APIProvider {
	callAPI(
		system_role: string,
		user_prompt: string,
		provider: Provider,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput>;

	testAPI(provider: Provider): Promise<boolean>;
}
