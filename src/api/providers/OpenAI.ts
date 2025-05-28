import { sendRequest } from '../index';
import { COMMON_CONSTANTS, OPENAI_STRUCTURE_OUTPUT } from '../constants';
import { APIProvider, ProviderConfig, StructuredOutput } from '../types';

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
		const response = await sendRequest(provider.baseUrl, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		const content = responseData?.choices[0]?.message?.content;
		const result = JSON.parse(content) as StructuredOutput;
		return {
			output: result.output,
			reliability: result.reliability,
		};
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		await this.callAPI(
			COMMON_CONSTANTS.VERIFY_CONNECTION_SYSTEM_PROMPT,
			COMMON_CONSTANTS.VERIFY_CONNECTION_USER_PROMPT,
			provider,
			provider.models[0]?.name
		);
		return true;
	}
}
