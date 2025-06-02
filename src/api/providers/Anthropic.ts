import { sendRequest } from '../index';
import { ANTHROPIC_TOOL_CONFIG, COMMON_CONSTANTS } from '../constants';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';

export class Anthropic implements APIProvider {
	buildHeaders(apiKey: string): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
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
			max_tokens: COMMON_CONSTANTS.DEFAULT_MAX_TOKENS,
			system: systemRole,
			messages: messages,
			temperature: provider.temperature ?? temperature,
			tools: [ANTHROPIC_TOOL_CONFIG],
			tool_choice: { type: 'tool', name: 'classify_content' },
		};

		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	// https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
	processApiResponse(responseData: any): StructuredOutput {
		const result = responseData?.content?.[0] as {
			id: string;
			input: StructuredOutput;
			name: string;
			type: string;
		};
		return {
			output: result.input.output,
			reliability: result.input.reliability,
		};
	}
}
