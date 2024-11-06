import { ApiError } from 'error/ApiError';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class Custom implements APIProvider {
	async callAPI(
		chatRole: string,
		promptTemplate: string,
		provider: ProviderConfig,
		model: string
	): Promise<StructuredOutput> {
		const header: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		const data = {
			model: model,
			messages: [
				{ role: 'system', content: chatRole },
				{ role: 'user', content: promptTemplate },
			],
			temperature: provider.temperature,
		};
		const requestParam: RequestUrlParam = {
			url: `${provider.baseUrl}${provider.endpoint}`,
			method: 'POST',
			headers: header,
			body: JSON.stringify(data),
		};

		const response = await requestUrl(requestParam);
		if (response.status !== 200) {
			throw new ApiError(`API request failed with status ${response.status}`);
		}
		const content = response.json.choices[0].message.content;
		return JSON.parse(content) as StructuredOutput;
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		try {
			await this.callAPI(
				'You are a test system.',
				`Return a JSON object like ${JSON.stringify({
					output: [],
					reliability: 0,
				})}`,
				provider,
				provider.models[0]?.name
			);
			return true;
		} catch (error) {
			return false;
		}
	}
}
