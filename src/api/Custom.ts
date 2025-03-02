import { getHeaders, getRequestParam } from 'api';
import { ApiError } from 'error/ApiError';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { LMSTUDIO_STRUCTURE_OUTPUT } from 'utils/constant';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class Custom implements APIProvider {
	async callAPI(
		system_role: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = getHeaders(provider.apiKey);

		// Create messages array for the API
		const messages = [
			{ role: 'system', content: system_role },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature || provider.temperature,
			response_format: LMSTUDIO_STRUCTURE_OUTPUT,
		};

		const response = await this.makeApiRequest(provider, headers, data);
		return this.processApiResponse(response);
	}

	private async makeApiRequest(
		provider: ProviderConfig,
		headers: Record<string, string>,
		data: object
	): Promise<any> {
		const url = `${provider.baseUrl}${provider.endpoint}`;
		const requestParam: RequestUrlParam = getRequestParam(url, headers, JSON.stringify(data));
		console.log('Custom API Request:', JSON.stringify(data, null, 2));

		try {
			const response = await requestUrl(requestParam);
			if (response.status !== 200) {
				console.error('API Error Response:', response.text);
				throw new ApiError(`API request failed with status ${response.status}: ${response.text}`);
			}
			return response.json;
		} catch (error) {
			console.error('API Request Error:', error);
			throw error;
		}
	}

	private processApiResponse(responseData: any): StructuredOutput {
		// Handle different response formats from various models
		const messageContent = responseData.choices[0].message.content;

		// Some models might return parsed JSON directly
		if (typeof messageContent === 'object' && messageContent !== null) {
			return messageContent as StructuredOutput;
		}

		// Otherwise parse the content as JSON
		const content = messageContent.trim();
		return JSON.parse(content) as StructuredOutput;
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		await this.callAPI(
			'You are a test system. You must respond with valid JSON.',
			`Return a JSON object containing {"output": [], "reliability": 0}`,
			provider,
			provider.models[0]?.name
		);
		return true;
	}
}
