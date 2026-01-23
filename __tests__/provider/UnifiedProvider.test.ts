// Mock the request module
jest.mock('provider/request', () => ({
	sendRequest: jest.fn(),
}));

import { UnifiedProvider } from 'provider/UnifiedProvider';
import { sendRequest } from 'provider/request';
import { ProviderConfig } from 'types';
import { requestUrl } from 'obsidian';
import { PROVIDER_NAMES } from 'lib';

jest.mock('obsidian');

const mockSendRequest = sendRequest as jest.MockedFunction<typeof sendRequest>;

describe('UnifiedProvider Tests', () => {
	const unifiedProvider = new UnifiedProvider();

	const mockConfig: ProviderConfig = {
		name: '',
		apiKey: 'test-key',
		baseUrl: 'https://api.test.com',
		models: [{ id: 'test-model', name: 'Test Model' }],
		temperature: 0.7
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Response parsing', () => {
		it('should parse OpenAI format with nested JSON content', () => {
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
		});

		it('should parse Anthropic tool_use format', () => {
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
		});

		it('should parse Gemini nested content format', () => {
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

		it('should parse Ollama message format', () => {
			const ollamaResponse = {
				message: {
					content: '{"output":["tag4"],"reliability":0.6}'
				}
			};
			expect(unifiedProvider.processApiResponse(ollamaResponse, PROVIDER_NAMES.OLLAMA)).toEqual({
				output: ['tag4'],
				reliability: 0.6
			});
		});

		it('should throw error for missing content in Gemini response', () => {
			const invalidResponse = { candidates: [] };
			expect(() => unifiedProvider.processApiResponse(invalidResponse, PROVIDER_NAMES.GEMINI))
				.toThrow('Gemini response missing content');
		});

		it('should throw error for missing content in Ollama response', () => {
			const invalidResponse = { message: {} };
			expect(() => unifiedProvider.processApiResponse(invalidResponse, PROVIDER_NAMES.OLLAMA))
				.toThrow('Ollama response missing content');
		});

		it('should throw error for invalid JSON structure in response', () => {
			const invalidJsonResponse = {
				choices: [{
					message: {
						content: '{"invalid":"structure"}'
					}
				}]
			};
			expect(() => unifiedProvider.processApiResponse(invalidJsonResponse))
				.toThrow('Invalid response structure: missing output array or reliability number');
		});

		it('should throw error for malformed JSON in response', () => {
			const malformedJsonResponse = {
				choices: [{
					message: {
						content: 'not valid json'
					}
				}]
			};
			expect(() => unifiedProvider.processApiResponse(malformedJsonResponse))
				.toThrow(/Failed to parse API response/);
		});
	});

	describe('API routing integration', () => {
		it('should handle Anthropic provider end-to-end', async () => {
			const config: ProviderConfig = {
				...mockConfig,
				name: PROVIDER_NAMES.ANTHROPIC
			};

			const mockApiResponse = {
				content: [{
					type: 'tool_use',
					input: { output: ['test'], reliability: 1.0 }
				}]
			};

			mockSendRequest.mockResolvedValueOnce(mockApiResponse);

			const result = await unifiedProvider.callAPI('system', 'user', config, 'model');

			expect(mockSendRequest).toHaveBeenCalledWith(
				config.baseUrl,
				expect.objectContaining({
					'x-api-key': 'test-key',
					'anthropic-version': '2023-06-01'
				}),
				expect.any(Object)
			);
			expect(result).toEqual({ output: ['test'], reliability: 1.0 });
		});

		it('should handle Gemini provider with API key in URL', async () => {
			const config: ProviderConfig = {
				...mockConfig,
				name: PROVIDER_NAMES.GEMINI
			};

			const mockApiResponse = {
				candidates: [{
					content: {
						parts: [{
							text: '{"output":["test"],"reliability":0.95}'
						}]
					}
				}]
			};

			mockSendRequest.mockResolvedValueOnce(mockApiResponse);

			await unifiedProvider.callAPI('system', 'user', config, 'gemini-pro');

			expect(mockSendRequest).toHaveBeenCalledWith(
				expect.stringContaining('models/gemini-pro:generateContent?key=test-key'),
				expect.any(Object),
				expect.any(Object)
			);
		});

		it('should handle temperature override in provider config', async () => {
			const config: ProviderConfig = {
				...mockConfig,
				name: PROVIDER_NAMES.OPENAI,
				temperature: 0.3
			};

			const mockApiResponse = {
				choices: [{
					message: { content: '{"output":["test"],"reliability":1.0}' }
				}]
			};

			mockSendRequest.mockResolvedValueOnce(mockApiResponse);

			await unifiedProvider.callAPI('system', 'user', config, 'model', 0.9);

			const callArgs = mockSendRequest.mock.calls[0];
			const bodyData = callArgs[2] as Record<string, unknown>;
			expect(bodyData.temperature).toBe(0.3);
		});
	});
});