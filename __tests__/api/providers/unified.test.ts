import { UnifiedProvider } from 'api';
import { ProviderConfig } from 'api/types';
import { requestUrl } from 'obsidian';
import { PROVIDER_NAMES } from 'utils';

jest.mock('obsidian');

describe('UnifiedProvider Tests', () => {
	const unifiedProvider = new UnifiedProvider();

	const mockConfig: ProviderConfig = {
		name: '',
		apiKey: 'test-key',
		baseUrl: 'https://api.test.com',
		models: ['test-model'],
		temperature: 0.7
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Provider-specific behavior', () => {
		test('uses correct headers for each provider', () => {
			// OpenAI/Default
			const defaultHeaders = unifiedProvider.buildHeaders('test-key');
			expect(defaultHeaders).toHaveProperty('Authorization', 'Bearer test-key');

			// Anthropic
			const anthropicHeaders = unifiedProvider.buildHeaders('test-key', PROVIDER_NAMES.ANTHROPIC);
			expect(anthropicHeaders).toHaveProperty('x-api-key', 'test-key');
			expect(anthropicHeaders).toHaveProperty('anthropic-version');

			// Gemini (no API key in headers)
			const geminiHeaders = unifiedProvider.buildHeaders('test-key', PROVIDER_NAMES.GEMINI);
			expect(geminiHeaders).not.toHaveProperty('Authorization');
		});

		test('correctly parses responses for each provider', () => {
			// OpenAI/Default format
			const openAIResponse = {
				choices: [{
					message: {
						content: '{"output":["tag1"],"reliability":0.9}'
					}
				}]
			};
			expect(unifiedProvider.processApiResponse(openAIResponse)).toEqual({
				output: ['tag1'],
				reliability: 0.9
			});

			// Anthropic format
			const anthropicResponse = {
				content: [{
					type: 'tool_use',
					input: { output: ['tag2'], reliability: 0.8 }
				}]
			};
			expect(unifiedProvider.processApiResponse(anthropicResponse, PROVIDER_NAMES.ANTHROPIC)).toEqual({
				output: ['tag2'],
				reliability: 0.8
			});

			// Gemini format
			const geminiResponse = {
				candidates: [{
					content: {
						parts: [{
							text: '{"output":["tag3"],"reliability":0.7}'
						}]
					}
				}]
			};
			expect(unifiedProvider.processApiResponse(geminiResponse, PROVIDER_NAMES.GEMINI)).toEqual({
				output: ['tag3'],
				reliability: 0.7
			});
		});
	});

	describe('API call routing', () => {
		test.each([
			PROVIDER_NAMES.OPENAI,
			PROVIDER_NAMES.ANTHROPIC,
			PROVIDER_NAMES.GEMINI,
			PROVIDER_NAMES.OLLAMA,
			PROVIDER_NAMES.OPENROUTER,
			PROVIDER_NAMES.DEEPSEEK,
			PROVIDER_NAMES.LMSTUDIO,
			'Custom'
		])('correctly routes %s provider', async (providerName) => {
			const config: ProviderConfig = {
				...mockConfig,
				name: providerName
			};

			const mockResponse = {
				status: 200,
				json: providerName === PROVIDER_NAMES.ANTHROPIC ? {
					content: [{
						type: 'tool_use',
						input: { output: ['test'], reliability: 1.0 }
					}]
				} : providerName === PROVIDER_NAMES.GEMINI ? {
					candidates: [{
						content: {
							parts: [{
								text: '{"output":["test"],"reliability":1.0}'
							}]
						}
					}]
				} : providerName === PROVIDER_NAMES.OLLAMA ? {
					message: {
						content: '{"output":["test"],"reliability":1.0}'
					}
				} : {
					choices: [{
						message: {
							content: '{"output":["test"],"reliability":1.0}'
						}
					}]
				}
			};

			(requestUrl as jest.Mock).mockResolvedValueOnce(mockResponse);

			const result = await unifiedProvider.callAPI(
				'system',
				'user',
				config,
				'model'
			);

			expect(result).toEqual({
				output: ['test'],
				reliability: 1.0
			});
		});
	});
});