import { sendRequest } from 'api';
import { API_CONSTANTS, OPENROUTER_STRUCTURE_OUTPUT } from 'utils/constants';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { ApiError } from './ApiError';

export class OpenRouter implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
			'X-Title': API_CONSTANTS.OPENROUTER_TITLE,
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
			temperature: temperature || provider.temperature,
			response_format: OPENROUTER_STRUCTURE_OUTPUT,
		};

		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		try {
			// Handle OpenRouter's response format
			if (responseData.choices && responseData.choices.length > 0) {
				const message = responseData.choices[0].message;

				// If content is already a parsed object
				if (message.content && typeof message.content === 'object') {
					return message.content as StructuredOutput;
				}

				// If content is a string that needs parsing
				if (message.content && typeof message.content === 'string') {
					const content = message.content.trim();
					return JSON.parse(content) as StructuredOutput;
				}
			}

			throw new ApiError('Invalid response format from OpenRouter API');
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError('Failed to parse response from OpenRouter API');
		}
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		await this.callAPI(
			API_CONSTANTS.VERIFY_CONNECTION_SYSTEM_PROMPT,
			API_CONSTANTS.VERIFY_CONNECTION_USER_PROMPT,
			provider,
			provider.models[0]?.name
		);
		return true;
	}
}
