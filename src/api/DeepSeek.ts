import { getHeaders, getRequestParam } from 'api';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { API_CONSTANTS, DEEPSEEK_STRUCTURE_OUTPUT } from 'utils/constant';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { ApiError } from './ApiError';

export class DeepSeek implements APIProvider {
	async callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = getHeaders(provider.apiKey);

		// Create messages array for the DeepSeek API
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature || provider.temperature,
			response_format: DEEPSEEK_STRUCTURE_OUTPUT,
			max_tokens: API_CONSTANTS.DEFAULT_MAX_TOKENS, // Ensure JSON string is not truncated
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
			throw new ApiError(`Failed to make request to DeepSeek API: ${error.message}`);
		}
	}

	private processApiResponse(responseData: any): StructuredOutput {
		// Handle DeepSeek's response format - expect JSON object with classifications array
		const messageContent = responseData.choices[0].message.content;
		const parsedContent =
			typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent;

		// Process classifications array from templates.ts format
		if (parsedContent.classifications && Array.isArray(parsedContent.classifications)) {
			const output = parsedContent.classifications.map((item: any) => item.category);
			const avgReliability =
				parsedContent.classifications.reduce(
					(sum: number, item: any) => sum + item.reliability,
					0
				) / parsedContent.classifications.length;

			return {
				output: output,
				reliability: Math.min(Math.max(avgReliability, 0), 1),
			};
		}

		// Fallback for direct output/reliability format
		return {
			output: Array.isArray(parsedContent.output) ? parsedContent.output : [parsedContent.output],
			reliability: Math.min(Math.max(parsedContent.reliability || 0, 0), 1),
		};
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
