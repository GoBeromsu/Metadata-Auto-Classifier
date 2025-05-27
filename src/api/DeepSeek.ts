import { sendRequest } from 'api';
import { API_CONSTANTS } from 'utils/constants';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class DeepSeek implements APIProvider {
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

		// Create messages array for the DeepSeek API
		const messages = [
			{ role: 'system', content: systemRole },
			{ role: 'user', content: user_prompt },
		];

		const data = {
			model: selectedModel,
			messages: messages,
			temperature: temperature,
			response_format: { type: 'json_object' },
			max_tokens: 8192, // max token : https://api-docs.deepseek.com/quick_start/pricing
		};

		const response = await sendRequest(provider.baseUrl, headers, data);

		return this.processApiResponse(response);
	}

	processApiResponse(responseData: any): StructuredOutput {
		const result = responseData.choices[0].message.content as StructuredOutput;
		return {
			output: result.output,
			reliability: result.reliability,
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
