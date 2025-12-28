import { PROVIDER_NAMES } from '../utils';
import {
	ANTHROPIC_TOOL_CONFIG,
	COMMON_CONSTANTS,
	GEMINI_STRUCTURE_OUTPUT,
	OLLAMA_STRUCTURE_OUTPUT,
	OPENAI_STRUCTURE_OUTPUT
} from './constants';
import { sendRequest } from './index';
import type { APIProvider, ProviderConfig, StructuredOutput } from './types';

const parseJsonResponse = (content: string, providerName: string): StructuredOutput => {
	try {
		const result = JSON.parse(content.trim());
		if (!Array.isArray(result.output) || typeof result.reliability !== 'number') {
			throw new Error('Invalid response structure: missing output array or reliability number');
		}
		return {
			output: result.output,
			reliability: result.reliability,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to parse ${providerName} response: ${message}. Raw content: ${content.substring(0, 200)}`);
	}
};

interface ProviderSpec {
	buildHeaders: (apiKey: string) => Record<string, string>;
	buildRequestBody: (systemRole: string, userPrompt: string, model: string, temperature?: number) => any;
	buildUrl: (baseUrl: string, model: string, apiKey: string) => string;
	parseResponse: (data: any) => StructuredOutput;
}

export class UnifiedProvider implements APIProvider {
	private specs: Record<string, ProviderSpec> = {
		[PROVIDER_NAMES.ANTHROPIC]: {
			buildHeaders: (apiKey: string) => ({
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			}),
			buildRequestBody: (systemRole, userPrompt, model, temperature) => ({
				model,
				max_tokens: COMMON_CONSTANTS.DEFAULT_MAX_TOKENS,
				system: systemRole,
				messages: [{ role: 'user', content: userPrompt }],
				temperature,
				tools: [ANTHROPIC_TOOL_CONFIG],
				tool_choice: { type: 'tool', name: 'classify_content' },
			}),
			buildUrl: (baseUrl) => baseUrl,
			parseResponse: (data) => {
				const result = data?.content?.[0];
				return {
					output: result.input.output,
					reliability: result.input.reliability,
				};
			}
		},
		[PROVIDER_NAMES.GEMINI]: {
			buildHeaders: () => ({
				'Content-Type': 'application/json',
			}),
			buildRequestBody: (systemRole, userPrompt, _, temperature) => ({
				contents: [{
					parts: [{ text: `${systemRole}\n\n${userPrompt}` }],
				}],
				generationConfig: {
					temperature,
					...GEMINI_STRUCTURE_OUTPUT,
				},
			}),
			buildUrl: (baseUrl, model, apiKey) =>
				`${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
			parseResponse: (data) => {
				const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
				if (!content) {
					throw new Error('Gemini response missing content');
				}
				return parseJsonResponse(content, 'Gemini');
			}
		},
		[PROVIDER_NAMES.OLLAMA]: {
			buildHeaders: (apiKey: string) => {
				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};
				if (apiKey) {
					headers.Authorization = `Bearer ${apiKey}`;
				}
				return headers;
			},
			buildRequestBody: (systemRole, userPrompt, model, temperature) => ({
				model,
				messages: [
					{ role: 'system', content: systemRole },
					{ role: 'user', content: userPrompt },
				],
				temperature,
				stream: false,
				format: OLLAMA_STRUCTURE_OUTPUT,
			}),
			buildUrl: (baseUrl) => baseUrl,
			parseResponse: (data) => {
				const content = data?.message?.content;
				if (!content) {
					throw new Error('Ollama response missing content');
				}
				return parseJsonResponse(content, 'Ollama');
			}
		},
		[PROVIDER_NAMES.OPENROUTER]: {
			buildHeaders: (apiKey: string) => ({
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
				'X-Title': 'Metadata Auto Classifier',
			}),
			buildRequestBody: (systemRole, userPrompt, model, temperature) => ({
				model,
				messages: [
					{ role: 'system', content: systemRole },
					{ role: 'user', content: userPrompt },
				],
				temperature,
				response_format: OPENAI_STRUCTURE_OUTPUT,
			}),
			buildUrl: (baseUrl) => baseUrl,
			parseResponse: (data) => {
				const content = data?.choices?.[0]?.message?.content;
				if (!content) {
					throw new Error('OpenRouter response missing content');
				}
				return parseJsonResponse(content, 'OpenRouter');
			}
		}
	};

	// Default spec for OpenAI, DeepSeek, LMStudio, Custom
	private defaultSpec: ProviderSpec = {
		buildHeaders: (apiKey: string) => ({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		}),
		buildRequestBody: (systemRole, userPrompt, model, temperature) => ({
			model,
			messages: [
				{ role: 'system', content: systemRole },
				{ role: 'user', content: userPrompt },
			],
			temperature,
			response_format: OPENAI_STRUCTURE_OUTPUT,
		}),
		buildUrl: (baseUrl) => baseUrl,
		parseResponse: (data) => {
			const content = data?.choices?.[0]?.message?.content;
			if (!content) {
				throw new Error('API response missing content');
			}
			return parseJsonResponse(content, 'API');
		}
	};

	private getSpec(providerName: string): ProviderSpec {
		return this.specs[providerName] || this.defaultSpec;
	}

	buildHeaders(apiKey: string, providerName?: string): Record<string, string> {
		const spec = this.getSpec(providerName || '');
		return spec.buildHeaders(apiKey);
	}

	async callAPI(
		systemRole: string,
		userPrompt: string,
		provider: ProviderConfig,
		selectedModel: string,
		temperature?: number
	): Promise<StructuredOutput> {
		const spec = this.getSpec(provider.name);

		const headers = spec.buildHeaders(provider.apiKey);
		const body = spec.buildRequestBody(
			systemRole,
			userPrompt,
			selectedModel,
			provider.temperature ?? temperature
		);
		const url = spec.buildUrl(provider.baseUrl, selectedModel, provider.apiKey);

		const response = await sendRequest(url, headers, body);
		return this.processApiResponse(response, provider.name);
	}

	processApiResponse(responseData: any, providerName?: string): StructuredOutput {
		const spec = this.getSpec(providerName || '');
		return spec.parseResponse(responseData);
	}
}