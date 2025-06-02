import { COMMON_CONSTANTS, GEMINI_STRUCTURE_OUTPUT } from '../constants';
import { sendRequest } from '../index';
import type { APIProvider, ProviderConfig, StructuredOutput } from '../types';

export class Gemini implements APIProvider {
	buildHeaders(apiKey?: string): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
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

		const combinedPrompt = `${systemRole}\n\n${user_prompt}`;

		const data = {
			contents: [
				{
					parts: [{ text: combinedPrompt }],
				},
			],
			generationConfig: {
				temperature: provider.temperature ?? temperature,
				...GEMINI_STRUCTURE_OUTPUT,
			},
		};

		const url = `${provider.baseUrl}/models/${selectedModel}:generateContent?key=${provider.apiKey}`;

		const response = await sendRequest(url, headers, data);
		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		const messageContent = responseData?.candidates[0]?.content?.parts[0]?.text;
		const content = messageContent.trim();
		const result = JSON.parse(content) as StructuredOutput;
		return {
			output: result.output,
			reliability: result.reliability,
		};
	}
}
