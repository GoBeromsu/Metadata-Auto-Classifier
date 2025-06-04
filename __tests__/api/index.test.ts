import { getProvider, sendRequest } from 'api';
import { COMMON_CONSTANTS } from 'api/constants';
import { Anthropic } from 'api/providers/Anthropic';
import { Custom } from 'api/providers/Custom';
import { DeepSeek } from 'api/providers/DeepSeek';
import { Gemini } from 'api/providers/Gemini';
import { LMStudio } from 'api/providers/LMStudio';
import { Ollama } from 'api/providers/Ollama';
import { OpenAI } from 'api/providers/OpenAI';
import { OpenRouter } from 'api/providers/OpenRouter';
import { ProviderConfig, StructuredOutput } from 'api/types';
import { requestUrl } from 'obsidian';
import { PROVIDER_NAMES } from 'utils';

// -------------------- getProvider Tests --------------------
describe('getProvider', () => {
	test('returns correct provider instances', () => {
		expect(getProvider(PROVIDER_NAMES.OPENAI)).toBeInstanceOf(OpenAI);
		expect(getProvider(PROVIDER_NAMES.ANTHROPIC)).toBeInstanceOf(Anthropic);
		expect(getProvider(PROVIDER_NAMES.OPENROUTER)).toBeInstanceOf(OpenRouter);
		expect(getProvider(PROVIDER_NAMES.GEMINI)).toBeInstanceOf(Gemini);
		expect(getProvider(PROVIDER_NAMES.DEEPSEEK)).toBeInstanceOf(DeepSeek);
		expect(getProvider(PROVIDER_NAMES.LMSTUDIO)).toBeInstanceOf(LMStudio);
		expect(getProvider(PROVIDER_NAMES.OLLAMA)).toBeInstanceOf(Ollama);
	});

	test('returns Custom provider for unknown name', () => {
		expect(getProvider('Unknown')).toBeInstanceOf(Custom);
	});
});

// -------------------- sendRequest Tests --------------------
describe('sendRequest', () => {
	const url = 'https://api.test.com';
	const headers = { Authorization: 'token' };
	const body = { foo: 'bar' };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('returns JSON for successful request', async () => {
		const mockResponse = { status: 200, json: { ok: true } };
		(requestUrl as jest.Mock).mockResolvedValueOnce(mockResponse);

		const result = await sendRequest(url, headers, body);
		expect(requestUrl).toHaveBeenCalledWith({
			url,
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
		expect(result).toEqual(mockResponse.json);
	});

	test('throws server error when status >= 500', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 500, text: 'oops' });
		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Server error (HTTP 500) from ${url}: oops`
		);
	});

	test('throws client error when status >= 400', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 404, text: 'missing' });
		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Client error (HTTP 404) from ${url}: missing`
		);
	});
});

// ---------------- processAPIRequest & testModel Tests ----------------

describe('processAPIRequest and testModel', () => {
	const providerConfig: ProviderConfig = {
		name: PROVIDER_NAMES.OPENAI,
		apiKey: 'k',
		baseUrl: 'url',
		models: [],
		temperature: 0.7,
	};

	const mockCallAPI = jest.fn();
	let processAPIRequest: (typeof import('api/index'))['processAPIRequest'];
	let testModel: (typeof import('api/index'))['testModel'];

	beforeAll(() => {
		jest.resetModules();
		jest.doMock('api/providers/OpenAI', () => {
			return {
				OpenAI: jest.fn().mockImplementation(() => ({
					callAPI: mockCallAPI,
				})),
			};
		});
		const apiIndex = require('api/index');
		processAPIRequest = apiIndex.processAPIRequest;
		testModel = apiIndex.testModel;
	});

	beforeEach(() => {
		mockCallAPI.mockClear();
	});

	test('processAPIRequest delegates to provider', async () => {
		const expected: StructuredOutput = { output: ['tag'], reliability: 1 };
		mockCallAPI.mockResolvedValueOnce(expected);

		const result = await processAPIRequest('sys', 'prompt', providerConfig, 'model');
		expect(mockCallAPI).toHaveBeenCalledWith('sys', 'prompt', providerConfig, 'model');
		expect(result).toEqual(expected);
	});

	test('testModel uses verification prompts', async () => {
		mockCallAPI.mockResolvedValueOnce({});
		const success = await testModel(providerConfig, 'model');

		expect(success).toBe(true);
		expect(mockCallAPI).toHaveBeenCalledWith(
			COMMON_CONSTANTS.VERIFY_CONNECTION_SYSTEM_PROMPT,
			COMMON_CONSTANTS.VERIFY_CONNECTION_USER_PROMPT,
			providerConfig,
			'model'
		);
	});
});
