import { sendRequest } from '../index';
import { COMMON_CONSTANTS, LMSTUDIO_STRUCTURE_OUTPUT } from '../constants';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';

export class LMStudio implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		// LM Studio typically doesn't require API key, but support it if provided
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

		// Create messages array for the LM Studio API (OpenAI-compatible)
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data with LM Studio structured output format
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature ?? provider.temperature,
			response_format: LMSTUDIO_STRUCTURE_OUTPUT,
			max_tokens: COMMON_CONSTANTS.DEFAULT_MAX_TOKENS,
		};

		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		const messageContent = responseData.choices[0].message.content;

		const content = messageContent.trim();
		const result = JSON.parse(content) as StructuredOutput;
		return {
			output: result.output,
			reliability: result.reliability,
		};
	}
}
