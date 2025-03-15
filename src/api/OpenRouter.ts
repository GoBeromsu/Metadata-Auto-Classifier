import { getHeaders, getRequestParam } from 'api';
import { ApiError } from 'error/ApiError';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { OPENROUTER_STRUCTURE_OUTPUT } from 'utils/constant';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class OpenRouter implements APIProvider {
	async callAPI(
		system_role: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = {
			...getHeaders(provider.apiKey),
			'X-Title': 'Metadata Auto Classifier',
		};

		// Create messages array for the API
		const messages = [
			{ role: 'system', content: system_role },
			{ role: 'user', content: user_prompt },
		];

		// Create the request data with structured output format
		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature || provider.temperature,
			response_format: OPENROUTER_STRUCTURE_OUTPUT,
		};

		const response = await this.makeApiRequest(provider, headers, data);
		console.log('OpenRouter API Response:', JSON.stringify(response, null, 2));
		return this.processApiResponse(response);
	}

	private async makeApiRequest(
		provider: ProviderConfig,
		headers: Record<string, string>,
		data: object
	): Promise<any> {
		const url = `${provider.baseUrl}${provider.endpoint}`;
		const requestParam: RequestUrlParam = getRequestParam(url, headers, JSON.stringify(data));
		console.log('OpenRouter API Request:', JSON.stringify(data, null, 2));

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
					try {
						const content = message.content.trim();
						return JSON.parse(content) as StructuredOutput;
					} catch (parseError) {
						console.error('Error parsing JSON response:', parseError);
						throw new ApiError('Failed to parse response as JSON');
					}
				}
			}

			throw new ApiError('Invalid response format from OpenRouter API');
		} catch (error) {
			console.error('Error processing API response:', error);
			throw error;
		}
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		const result = await this.callAPI(
			'You are a test system. You must respond with valid JSON.',
			`Return a JSON object containing {"output": [], "reliability": 0}`,
			provider,
			provider.models[0]?.name
		);
		console.log('OpenRouter verifyConnection result:', result);
		return true;
	}
}
