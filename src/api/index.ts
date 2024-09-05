import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, Provider } from 'types/APIInterface';

export class OpenAIProvider implements APIProvider {
	private static baseUrl = 'https://api.openai.com/v1/chat/completions';

	async callAPI(
		system_role: string,
		user_prompt: string,
		provider: Provider,
		temperature: number = 0,
		top_p: number = 0.95,
		frequency_penalty: number = 0,
		presence_penalty: number = 0.5
	): Promise<string> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${provider.apiKey}`,
			'Content-Type': 'application/json',
		};

		const data = {
			model: provider.models[0].name, // Assuming the first model is the default
			messages: [
				{ role: 'system', content: system_role },
				{ role: 'user', content: user_prompt },
			],
			max_tokens: provider.maxTokens,
			temperature: temperature,
			top_p: top_p,
			frequency_penalty: frequency_penalty,
			presence_penalty: presence_penalty,
		};

		const requestParam: RequestUrlParam = {
			url: OpenAIProvider.baseUrl,
			method: 'POST',
			headers: headers,
			body: JSON.stringify(data),
		};

		try {
			const response = await requestUrl(requestParam);
			if (response.status !== 200) {
				throw new Error(`API request failed with status ${response.status}`);
			}
			const responseData = response.json;
			if (responseData.choices && responseData.choices.length > 0) {
				return responseData.choices[0].message.content.trim();
			} else {
				throw new Error('No response from the API');
			}
		} catch (error) {
			console.error('Error calling OpenAI API:', error);
			throw error;
		}
	}

	async testAPI(provider: Provider): Promise<boolean> {
		try {
			await this.callAPI(
				'You are a test system.',
				'This is a test prompt.',
				provider,
				undefined,
				undefined,
				undefined,
				undefined
			);
			return true;
		} catch (error) {
			console.error('OpenAI API test failed:', error);
			return false;
		}
	}
}

export class AIFactory {
	static getProvider(providerName: string): APIProvider {
		switch (providerName.toLowerCase()) {
			case 'openai':
				return new OpenAIProvider();
			// Add other AI providers here
			default:
				throw new Error(`Unknown AI provider: ${providerName}`);
		}
	}
}
