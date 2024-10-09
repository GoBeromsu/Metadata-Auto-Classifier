import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, Provider, StructuredOutput } from '../types/apiInterface';
import { APIError } from '../error/apiError';
import { ErrorHandler } from '../error/errorHandler';

export class OpenAIProvider implements APIProvider {
	private static baseUrl = 'https://api.openai.com/v1/chat/completions';

	async callAPI(
		system_role: string,
		user_prompt: string,
		provider: Provider,
		temperature: number = 0.5,
		top_p: number = 0.95,
		frequency_penalty: number = 0,
		presence_penalty: number = 0.5
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${provider.apiKey}`,
			'Content-Type': 'application/json',
		};

		const data = {
			model: provider.models[0].name,
			messages: [
				{ role: 'system', content: system_role },
				{ role: 'user', content: user_prompt },
			],
			max_tokens: provider.maxTokens,
			temperature: temperature,
			top_p: top_p,
			frequency_penalty: frequency_penalty,
			presence_penalty: presence_penalty,
			response_format: { type: 'json_object' },
		};

		const requestParam: RequestUrlParam = {
			url: OpenAIProvider.baseUrl,
			method: 'POST',
			headers: headers,
			body: JSON.stringify(data),
		};

		const response = await requestUrl(requestParam);
		if (response.status !== 200) {
			throw new APIError(`API request failed with status ${response.status}`);
		}
		const responseData = response.json;

		if (responseData.choices && responseData.choices.length > 0) {
			const content = responseData.choices[0].message.content.trim();
			return JSON.parse(content) as StructuredOutput;
		} else {
			throw new APIError('No response from the API');
		}
	}

	async testAPI(provider: Provider): Promise<boolean> {
		try {
			await this.callAPI('You are a test system.', 'This is a test prompt.', provider);
			return true;
		} catch (error) {
			ErrorHandler.handle(error as Error, 'OpenAI API Test');
			return false;
		}
	}
}

export class AIFactory {
	static getProvider(providerName: string): APIProvider {
		switch (providerName.toLowerCase()) {
			case 'openai':
				return new OpenAIProvider();
			default:
				throw new Error(`Unknown AI provider: ${providerName}`);
		}
	}
}
