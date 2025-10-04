import { getProvider, sendRequest, UnifiedProvider } from 'api';
import { COMMON_CONSTANTS } from 'api/constants';
import { ProviderConfig, StructuredOutput } from 'api/types';
import { requestUrl } from 'obsidian';
import { PROVIDER_NAMES } from 'utils';

// -------------------- getProvider Tests --------------------
describe('getProvider', () => {
	test('returns UnifiedProvider instance', () => {
		expect(getProvider()).toBeInstanceOf(UnifiedProvider);
	});

	test('returns the same instance every time', () => {
		const provider1 = getProvider();
		const provider2 = getProvider();
		expect(provider1).toBe(provider2);
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
		jest.doMock('api/UnifiedProvider', () => {
			return {
				UnifiedProvider: jest.fn().mockImplementation(() => ({
					callAPI: mockCallAPI,
					buildHeaders: jest.fn(),
					processApiResponse: jest.fn(),
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
