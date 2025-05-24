import { getHeaders, getRequestParam } from 'api';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { ApiError } from './ApiError';
import { GEMINI_STRUCTURE_OUTPUT } from 'utils/constant';

export class Gemini implements APIProvider {
	async callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = getHeaders(provider.apiKey);

		// Create messages array for the Gemini API
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature || provider.temperature,
			response_mime_type: 'application/json',
			response_schema: GEMINI_STRUCTURE_OUTPUT.json_schema,
		};

		const response = await this.makeApiRequest(provider, headers, data);
		return this.processApiResponse(response);
	}

	private async makeApiRequest(
		provider: ProviderConfig,
		headers: Record<string, string>,
		data: object
	): Promise<any> {
		const url = provider.baseUrl;
		const requestParam: RequestUrlParam = getRequestParam(url, headers, JSON.stringify(data));

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
			throw new ApiError(`Failed to make request to Gemini API: ${error.message}`);
		}
	}

	private processApiResponse(responseData: any): StructuredOutput {
		try {
			// Handle Gemini's response format
			if (responseData.output && typeof responseData.reliability === 'number') {
				return {
					output: Array.isArray(responseData.output) ? responseData.output : [responseData.output],
					reliability: Math.min(Math.max(responseData.reliability, 0), 1),
				};
			}

			throw new ApiError('Invalid response format from Gemini API');
		} catch (error) {
			throw error;
		}
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		await this.callAPI(
			'You are a test system. You must respond with valid JSON.',
			'Return a JSON object containing {"output": [], "reliability": 0}',
			provider,
			provider.models[0]?.name
		);
		return true;
	}
}
