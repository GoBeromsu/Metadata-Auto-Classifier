// Mock the request module
jest.mock('provider/request', () => ({
	sendRequest: jest.fn(),
	sendStreamingRequest: jest.fn(),
}));

import { UnifiedProvider } from 'provider/UnifiedProvider';
import { sendRequest, sendStreamingRequest } from 'provider/request';
import { ProviderConfig } from 'types';
import { requestUrl } from 'obsidian';
import { PROVIDER_NAMES } from 'lib';

jest.mock('obsidian');

const mockSendRequest = sendRequest as jest.MockedFunction<typeof sendRequest>;
const mockSendStreamingRequest = sendStreamingRequest as jest.MockedFunction<typeof sendStreamingRequest>;

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

	describe('getApiKey', () => {
		it('should extract API key from new auth field', async () => {
			const config: ProviderConfig = {
				...mockConfig,
				name: PROVIDER_NAMES.OPENAI,
				auth: { type: 'apiKey', apiKey: 'new-format-key' },
				apiKey: 'legacy-key', // Should be ignored
			};

			const mockApiResponse = {
				choices: [{
					message: { content: '{"output":["test"],"reliability":1.0}' }
				}]
			};

			mockSendRequest.mockResolvedValueOnce(mockApiResponse);

			await unifiedProvider.callAPI('system', 'user', config, 'model');

			const callArgs = mockSendRequest.mock.calls[0];
			const headers = callArgs[1] as Record<string, string>;
			expect(headers.Authorization).toBe('Bearer new-format-key');
		});

		it('should fall back to legacy apiKey field', async () => {
			const config: ProviderConfig = {
				...mockConfig,
				name: PROVIDER_NAMES.OPENAI,
				apiKey: 'legacy-api-key',
			};

			const mockApiResponse = {
				choices: [{
					message: { content: '{"output":["test"],"reliability":1.0}' }
				}]
			};

			mockSendRequest.mockResolvedValueOnce(mockApiResponse);

			await unifiedProvider.callAPI('system', 'user', config, 'model');

			const callArgs = mockSendRequest.mock.calls[0];
			const headers = callArgs[1] as Record<string, string>;
			expect(headers.Authorization).toBe('Bearer legacy-api-key');
		});
	});

	describe('Codex provider with OAuth', () => {
		it('should use OAuth tokens from new auth field for Codex', async () => {
			const config: ProviderConfig = {
				name: PROVIDER_NAMES.CODEX,
				baseUrl: 'https://codex.api',
				models: [],
				auth: {
					type: 'oauth',
					oauth: {
						accessToken: 'new-oauth-token',
						refreshToken: 'refresh',
						expiresAt: Date.now() / 1000 + 3600,
						accountId: 'new-account-id',
					},
				},
			};

			// Codex uses streaming, so mock returns accumulated text
			const mockStreamedText = '{"output":["test"],"reliability":1.0}';
			mockSendStreamingRequest.mockResolvedValueOnce(mockStreamedText);

			await unifiedProvider.callAPI('system', 'user', config, 'model');

			// Verify sendStreamingRequest was called with correct headers
			const callArgs = mockSendStreamingRequest.mock.calls[0];
			const headers = callArgs[1] as Record<string, string>;
			expect(headers.Authorization).toBe('Bearer new-oauth-token');
			expect(headers['ChatGPT-Account-Id']).toBe('new-account-id');
		});

		it('should fall back to legacy oauth field for Codex', async () => {
			const config: ProviderConfig = {
				name: PROVIDER_NAMES.CODEX,
				baseUrl: 'https://codex.api',
				models: [],
				oauth: {
					accessToken: 'legacy-oauth-token',
					refreshToken: 'refresh',
					expiresAt: Date.now() / 1000 + 3600,
					accountId: 'legacy-account-id',
				},
			};

			// Codex uses streaming, so mock returns accumulated text
			const mockStreamedText = '{"output":["test"],"reliability":1.0}';
			mockSendStreamingRequest.mockResolvedValueOnce(mockStreamedText);

			await unifiedProvider.callAPI('system', 'user', config, 'model');

			// Verify sendStreamingRequest was called with correct headers
			const callArgs = mockSendStreamingRequest.mock.calls[0];
			const headers = callArgs[1] as Record<string, string>;
			expect(headers.Authorization).toBe('Bearer legacy-oauth-token');
			expect(headers['ChatGPT-Account-Id']).toBe('legacy-account-id');
		});

		it('should throw error when Codex OAuth is not configured', async () => {
			const config: ProviderConfig = {
				name: PROVIDER_NAMES.CODEX,
				baseUrl: 'https://codex.api',
				models: [],
				// No oauth configured
			};

			await expect(unifiedProvider.callAPI('system', 'user', config, 'model'))
				.rejects.toThrow('Codex OAuth tokens incomplete');
		});

		it('should parse Codex response format correctly', () => {
			const codexResponse = {
				output: [{
					type: 'message',
					content: [{
						type: 'output_text',
						text: '{"output":["category1","category2"],"reliability":0.85}'
					}]
				}]
			};

			const result = unifiedProvider.processApiResponse(codexResponse, PROVIDER_NAMES.CODEX);

			expect(result).toEqual({
				output: ['category1', 'category2'],
				reliability: 0.85
			});
		});

		it('should throw error for invalid Codex response without output array', () => {
			const invalidResponse = { notOutput: [] };
			expect(() => unifiedProvider.processApiResponse(invalidResponse, PROVIDER_NAMES.CODEX))
				.toThrow('Codex response missing output array');
		});

		it('should throw error for Codex response without message content', () => {
			const invalidResponse = {
				output: [{
					type: 'other',
					content: []
				}]
			};
			expect(() => unifiedProvider.processApiResponse(invalidResponse, PROVIDER_NAMES.CODEX))
				.toThrow('Codex response missing message content');
		});
	});
});