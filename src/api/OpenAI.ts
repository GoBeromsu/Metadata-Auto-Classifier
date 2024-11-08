import { requestUrl, RequestUrlParam } from 'obsidian';
import { APIProvider, StructuredOutput } from 'utils/interface';
import { ApiError } from '../error/ApiError';
import { ErrorHandler } from '../error/ErrorHandler';
import { ProviderConfig } from '../utils/interface';
import { createRequestBody, getHeaders, getRequestParam } from 'api';

export class OpenAI implements APIProvider {
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
			response_format: { type: 'json_object' },
		};

		const url = `${provider.baseUrl}${provider.endpoint}`;
		const requestParam: RequestUrlParam = getRequestParam(url, headers, JSON.stringify(data));
		const response = await requestUrl(requestParam);

		if (response.status !== 200) {
			throw new ApiError(`API request failed with status ${response.status}`);
		}
		const responseData = response.json;

		if (responseData.choices && responseData.choices.length > 0) {
			const content = responseData.choices[0].message.content.trim();
			return JSON.parse(content) as StructuredOutput;
		} else {
			throw new ApiError('No response from the API');
		}
	}

	async verifyConnection(provider: ProviderConfig): Promise<boolean> {
		try {
			/**
			 * NOTE: When using JSON mode, the model must be explicitly instructed
			 * to produce JSON via a system or user message.
			 * @see https://platform.openai.com/docs/api-reference/chat
			 */
			await this.callAPI(
				'You are a test system.',

				'Return a JSON object containing "status": "ok"',
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
