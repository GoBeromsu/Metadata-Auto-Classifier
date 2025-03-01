import { createRequestBody, getHeaders, getRequestParam } from 'api';
import { ApiError } from 'error/ApiError';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { LMSTUDIO_STRUCTURE_OUTPUT } from 'utils/constant';
import { APIProvider, ProviderConfig, StructuredOutput } from 'utils/interface';

export class Custom implements APIProvider {
	async callAPI(
		system_role: string,
		user_prompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const headers: Record<string, string> = getHeaders(provider.apiKey);
		const data = {
			...createRequestBody(system_role, user_prompt, selectedModel, temperature),
			...{ response_format: LMSTUDIO_STRUCTURE_OUTPUT },
		};

		const response = await this.makeApiRequest(provider, headers, data);

		return this.processApiResponse(response);
	}

	private async makeApiRequest(
		provider: ProviderConfig,
		headers: Record<string, string>,
		data: object
	): Promise<any> {
		const url = `${provider.baseUrl}${provider.endpoint}`;
		const requestParam: RequestUrlParam = getRequestParam(url, headers, JSON.stringify(data));

		const response = await requestUrl(requestParam);
		if (response.status !== 200) {
			throw new ApiError(`API request failed with status ${response.status}`);
		}

		return response.json;
	}

	private processApiResponse(responseData: any): StructuredOutput {
		if (responseData.choices && responseData.choices.length > 0) {
			const content = responseData.choices[0].message.content.trim();
			return JSON.parse(content) as StructuredOutput;
		} else {
			throw new ApiError('No response from the API');
		}
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
