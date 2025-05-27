import { getRequestParam } from 'api';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { ANTHROPIC_TOOL_CONFIG, API_CONSTANTS } from 'utils/constants';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';
import { ApiError } from './ApiError';

export class Anthropic implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': API_CONSTANTS.ANTHROPIC_VERSION,
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

		// Create messages array for the Anthropic API
		const messages = [{ role: 'user', content: user_prompt }];

		// Use tool calling for structured output
		const data = {
			model: selectedModel,
			max_tokens: API_CONSTANTS.DEFAULT_MAX_TOKENS,
			system: systemRole,
			messages: messages,
			temperature: temperature || provider.temperature,
			tools: [ANTHROPIC_TOOL_CONFIG],
			tool_choice: { type: 'tool', name: API_CONSTANTS.ANTHROPIC_TOOL_NAME },
		};

		const response = await this.makeApiRequest(provider, headers, data);
		return this.processApiResponse(response);
	}

	async makeApiRequest(
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
			throw new ApiError(`Failed to make request to Anthropic API: ${error.message}`);
		}
	}

	processApiResponse(responseData: any): StructuredOutput {
		try {
			// Handle Anthropic's tool calling response format
			if (responseData.content && Array.isArray(responseData.content)) {
				// Look for tool_use content
				const toolUseContent = responseData.content.find(
					(content: any) =>
						content.type === 'tool_use' && content.name === API_CONSTANTS.ANTHROPIC_TOOL_NAME
				);

				if (toolUseContent && toolUseContent.input) {
					const input = toolUseContent.input;

					// Validate the structure
					if (input.output && typeof input.reliability === 'number') {
						return {
							output: Array.isArray(input.output) ? input.output : [input.output],
							reliability: Math.min(
								Math.max(input.reliability, API_CONSTANTS.DEFAULT_RELIABILITY_MIN),
								API_CONSTANTS.DEFAULT_RELIABILITY_MAX
							),
						};
					}
				}
			}

			throw new ApiError('Invalid response format from Anthropic API - no valid tool use found');
		} catch (error) {
			throw error;
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
