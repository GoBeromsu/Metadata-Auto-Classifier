import { API_CONSTANTS, GEMINI_STRUCTURE_OUTPUT } from 'utils/constants';
import { APIProvider, ProviderConfig, StructuredOutput } from '../types';
import { ApiError } from '../ApiError';
import { sendRequest } from 'api';

export class Gemini implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		};

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

		// Create messages array for the Gemini API
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data with Gemini structured output configuration
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature || provider.temperature,
			...GEMINI_STRUCTURE_OUTPUT,
		};

		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		try {
			// Handle Gemini's structured output response format
			if (responseData.output && typeof responseData.reliability === 'number') {
				return {
					output: Array.isArray(responseData.output) ? responseData.output : [responseData.output],
					reliability: Math.min(
						Math.max(responseData.reliability, API_CONSTANTS.DEFAULT_RELIABILITY_MIN),
						API_CONSTANTS.DEFAULT_RELIABILITY_MAX
					),
				};
			}

			// Handle potential different response structure from Gemini
			if (responseData.candidates && responseData.candidates.length > 0) {
				const candidate = responseData.candidates[0];
				if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
					const content = candidate.content.parts[0].text;
					if (content) {
						const parsed = JSON.parse(content);
						return {
							output: Array.isArray(parsed.output) ? parsed.output : [parsed.output],
							reliability: Math.min(
								Math.max(parsed.reliability || 0, API_CONSTANTS.DEFAULT_RELIABILITY_MIN),
								API_CONSTANTS.DEFAULT_RELIABILITY_MAX
							),
						};
					}
				}
			}

			throw new ApiError('Invalid response format from Gemini API');
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError('Failed to parse response from Gemini API');
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
