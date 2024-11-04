import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIError } from '../error/APIError';
import ErrorHandler from '../error/ErrorHandler';
import { Provider } from '../types/interface';
import { APIProvider, StructuredOutput } from './interface';

export default class OpenAIProvider implements APIProvider {
	async callAPI(
		system_role: string,
		user_prompt: string,
		provider: Provider,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${provider.apiKey}`,
			'Content-Type': 'application/json',
		};

		const data = {
			model: selectedModel,
			messages: [
				{ role: 'system', content: system_role },
				{ role: 'user', content: user_prompt },
			],
			temperature: temperature ?? provider.temperature,
			response_format: { type: 'json_object' },
		};

		const requestParam: RequestUrlParam = {
			url: `${provider.baseUrl}/chat/completions`,
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
			await this.callAPI(
				'You are a test system.',
				'This is a test prompt.',
				provider,
				provider.models[0].name
			);
			return true;
		} catch (error) {
			ErrorHandler.handle(error as Error, 'OpenAI API Test');
			return false;
		}
	}
}
