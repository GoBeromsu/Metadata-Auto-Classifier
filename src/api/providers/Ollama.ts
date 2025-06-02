import { OLLAMA_STRUCTURE_OUTPUT } from '../constants';
import { sendRequest } from '../index';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';

export class Ollama implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		// Ollama typically doesn't require API key for local instances, but support it if provided
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		return headers;
	}

	async callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = this.buildHeaders(provider.apiKey);

		// Create messages array for the Ollama API (native)
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data with Ollama native API format
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature ?? provider.temperature,
			stream: false,
			format: OLLAMA_STRUCTURE_OUTPUT,
		};

		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		// Ollama native API returns response in message.content field
		const messageContent = responseData.message.content;

		const content = messageContent.trim();
		const result = JSON.parse(content) as StructuredOutput;
		return {
			output: result.output,
			reliability: result.reliability,
		};
	}
}
