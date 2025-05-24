import { getHeaders, getRequestParam } from 'api';
import { ApiError } from 'error/ApiError';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class Anthropic implements APIProvider {
	async callAPI(
		systemRole: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		// Create headers specific for Anthropic API
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'x-api-key': provider.apiKey,
			'anthropic-version': '2023-06-01',
		};

		// Create messages array for the Anthropic API
		const messages = [{ role: 'user', content: user_prompt }];

		// Use tool calling for structured output
		const data = {
			model: selectedModel,
			max_tokens: 1024,
			system: systemRole,
			messages: messages,
			temperature: temperature || provider.temperature,
			tools: [
				{
					name: 'classify_content',
					description: 'Classify content and return structured metadata',
					input_schema: {
						type: 'object',
						properties: {
							output: {
								type: 'array',
								items: { type: 'string' },
								description: 'Array of classification tags or metadata values',
							},
							reliability: {
								type: 'number',
								minimum: 0,
								maximum: 100,
								description: 'Confidence score from 0 to 100',
							},
						},
						required: ['output', 'reliability'],
					},
				},
			],
			tool_choice: { type: 'tool', name: 'classify_content' },
		};

		const response = await this.makeApiRequest(provider, headers, data);
		return this.processApiResponse(response);
	}

	private async makeApiRequest(
		provider: ProviderConfig,
		headers: Record<string, string>,
		data: object
	): Promise<any> {
		const url = provider.baseUrl; // Use baseUrl directly as it already includes the endpoint
		const requestParam: RequestUrlParam = getRequestParam(url, headers, JSON.stringify(data));

		console.log('Anthropic API Request URL:', url);
		console.log('Anthropic API Request Headers:', JSON.stringify(headers, null, 2));
		console.log('Anthropic API Request Data:', JSON.stringify(data, null, 2));

		try {
			const response = await requestUrl(requestParam);
			console.log('Anthropic API Response Status:', response.status);
			console.log('Anthropic API Response Headers:', JSON.stringify(response.headers, null, 2));

			if (response.status !== 200) {
				console.error('API Error Response Text:', response.text);
				throw new ApiError(`API request failed with status ${response.status}: ${response.text}`);
			}

			console.log('Anthropic API Response Body:', JSON.stringify(response.json, null, 2));
			return response.json;
		} catch (error) {
			console.error('API Request Error Details:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(`Failed to make request to Anthropic API: ${error.message}`);
		}
	}

	private processApiResponse(responseData: any): StructuredOutput {
		try {
			// Handle Anthropic's tool calling response format
			if (responseData.content && Array.isArray(responseData.content)) {
				// Look for tool_use content
				const toolUseContent = responseData.content.find(
					(content: any) => content.type === 'tool_use' && content.name === 'classify_content'
				);

				if (toolUseContent && toolUseContent.input) {
					const input = toolUseContent.input;

					// Validate the structure
					if (input.output && typeof input.reliability === 'number') {
						return {
							output: Array.isArray(input.output) ? input.output : [input.output],
							reliability: Math.min(Math.max(input.reliability, 0), 100),
						};
					}
				}
			}

			throw new ApiError('Invalid response format from Anthropic API - no valid tool use found');
		} catch (error) {
			console.error('Error processing API response:', error);
			throw error;
		}
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		await this.callAPI(
			'You are a test system. Use the classify_content tool to respond.',
			'Test the connection by returning {"output": [], "reliability": 0}',
			provider,
			provider.models[0]?.name
		);
		return true;
	}
}
