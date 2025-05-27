import { getRequestParam } from 'api';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, StructuredOutput } from 'utils/interface';
import { API_CONSTANTS, OPENAI_STRUCTURE_OUTPUT } from '../utils/constants';
import { ProviderConfig } from '../utils/interface';
import { ApiError } from './ApiError';

export class OpenAI implements APIProvider {
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

		// Create messages array for the OpenAI API
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature || provider.temperature,
			response_format: OPENAI_STRUCTURE_OUTPUT,
		};

		const response = await this.sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	async sendRequest(
		baseUrl: string,
		headers: Record<string, string>,
		data: object
	): Promise<any> {
		const requestParam: RequestUrlParam = getRequestParam(baseUrl, headers, data);

		try {
			const response = await requestUrl(requestParam);
			if (response.status !== 200) {
				throw new ApiError(`API request failed with status ${response.status}: ${response.text}`);
			}
			return response.json;
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(`Failed to make request to OpenAI API: ${error.message}`);
		}
	}

	processApiResponse(responseData: any): StructuredOutput {
		try {
			// Handle different response formats from various models
			const messageContent = responseData.choices[0].message.content;

			// Some newer models might return parsed JSON directly
			if (typeof messageContent === 'object' && messageContent !== null) {
				return messageContent as StructuredOutput;
			}

			// Otherwise parse the content as JSON
			const content = messageContent.trim();
			return JSON.parse(content) as StructuredOutput;
		} catch (error) {
			throw new ApiError('Failed to parse response from OpenAI API');
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
