import { requestUrl } from 'obsidian';
import { Anthropic } from '../../src/api/providers/Anthropic';
import { Custom } from '../../src/api/providers/Custom';
import { DeepSeek } from '../../src/api/providers/DeepSeek';
import { Gemini } from '../../src/api/providers/Gemini';
import { OpenAI } from '../../src/api/providers/OpenAI';
import { OpenRouter } from '../../src/api/providers/OpenRouter';
import { ProviderConfig, StructuredOutput } from '../../src/api/types';

describe('API callAPI Tests', () => {
	const createMockProvider = (name: string, baseUrl: string): ProviderConfig => ({
		name,
		apiKey: 'test-api-key',
		baseUrl,
		temperature: 0.7,
		models: [{ name: 'test-model', displayName: 'Test Model' }],
	});

	const testSystemRole = 'You are a helpful assistant that classifies content.';
	const testUserPrompt = 'Classify this content: "This is a test document about machine learning."';
	const testModel = 'test-model';
	const testTemperature = 0.5;

	// Common test data
	const DEFAULT_OUTPUT = ['machine learning', 'technology', 'test'];
	const DEFAULT_RELIABILITY = 0.9;

	// Response factory functions
	const createChoicesResponse = (output: string[], reliability: number) => ({
		status: 200,
		json: {
			choices: [
				{
					message: {
						content: JSON.stringify({ output, reliability }),
					},
				},
			],
		},
	});

	const createAnthropicResponse = (output: string[], reliability: number) => ({
		status: 200,
		json: {
			content: [
				{
					type: 'tool_use',
					name: 'classify_content',
					input: { output, reliability },
				},
			],
		},
	});

	const createGeminiResponse = (output: string[], reliability: number) => ({
		status: 200,
		json: {
			candidates: [
				{
					content: {
						parts: [
							{
								text: JSON.stringify({ output, reliability }),
							},
						],
					},
				},
			],
		},
	});

	const createDeepSeekResponse = (output: string[], reliability: number) => ({
		status: 200,
		json: {
			choices: [
				{
					message: {
						content: JSON.stringify({ output, reliability }),
					},
				},
			],
		},
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Simplified API providers configuration
	const apiProviders = [
		{
			name: 'OpenAI',
			class: OpenAI,
			baseUrl: 'https://api.openai.com/v1/chat/completions',
			createResponse: () => createChoicesResponse(DEFAULT_OUTPUT, DEFAULT_RELIABILITY),
		},
		{
			name: 'Anthropic',
			class: Anthropic,
			baseUrl: 'https://api.anthropic.com/v1/messages',
			createResponse: () => createAnthropicResponse(DEFAULT_OUTPUT, DEFAULT_RELIABILITY),
		},
		{
			name: 'Custom',
			class: Custom,
			baseUrl: 'https://api.custom.com/v1/chat/completions',
			createResponse: () => createChoicesResponse(DEFAULT_OUTPUT, DEFAULT_RELIABILITY),
		},
		{
			name: 'OpenRouter',
			class: OpenRouter,
			baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
			createResponse: () => createChoicesResponse(DEFAULT_OUTPUT, DEFAULT_RELIABILITY),
		},
		{
			name: 'Gemini',
			class: Gemini,
			baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
			createResponse: () => createGeminiResponse(DEFAULT_OUTPUT, DEFAULT_RELIABILITY),
		},
		{
			name: 'DeepSeek',
			class: DeepSeek,
			baseUrl: 'https://api.deepseek.com/v1/chat/completions',
			createResponse: () => createDeepSeekResponse(DEFAULT_OUTPUT, DEFAULT_RELIABILITY),
		},
	];

	describe.each(apiProviders)(
		'$name API',
		({ name, class: ProviderClass, baseUrl, createResponse }) => {
			test('should return valid StructuredOutput for successful API call', async () => {
				const mockProvider = createMockProvider(name, baseUrl);
				const mockResponse = createResponse();

				(requestUrl as jest.Mock).mockResolvedValueOnce(mockResponse);

				const provider = new ProviderClass();
				const result: StructuredOutput = await provider.callAPI(
					testSystemRole,
					testUserPrompt,
					mockProvider,
					testModel,
					testTemperature
				);

				expect(result.output).toEqual(DEFAULT_OUTPUT);
				expect(result.reliability).toBe(DEFAULT_RELIABILITY);
				expect(Array.isArray(result.output)).toBe(true);
				expect(typeof result.reliability).toBe('number');
			});
		}
	);
});
