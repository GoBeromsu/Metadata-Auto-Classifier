import { OPENROUTER_STRUCTURE_OUTPUT } from '../constants';
import { sendRequest } from '../index';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';

export class OpenRouter implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
			'X-Title': 'Metadata Auto Classifier',
		};
	}
	async callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = this.buildHeaders(provider.apiKey);

		// Create messages array for the API
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data with structured output format
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: provider.temperature ?? temperature,
			response_format: OPENROUTER_STRUCTURE_OUTPUT,
		};

		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		// Handle OpenRouter's response format
		if (responseData.choices && responseData.choices.length > 0) {
			const messageContent = responseData.choices[0].message.content;

			// If content is already a parsed object
			if (messageContent && typeof messageContent === 'object') {
				return {
					output: messageContent.output,
					reliability: messageContent.reliability,
				};
			}

			// If content is a string that needs parsing
			if (messageContent && typeof messageContent === 'string') {
				const content = messageContent.trim();
				const result = JSON.parse(content) as StructuredOutput;
				return {
					output: result.output,
					reliability: result.reliability,
				};
			}
		}
		throw new Error('Failed to parse response from OpenRouter API');
	}
}
