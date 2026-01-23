import { sendRequest } from 'provider';
import { requestUrl } from 'obsidian';

describe('sendRequest', () => {
	const url = 'https://api.test.com';
	const headers = { Authorization: 'token' };
	const body = { foo: 'bar' };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return JSON for successful request', async () => {
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

	it('should throw server error when status is 500', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 500, text: 'Internal Server Error' });

		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Server error (HTTP 500) from ${url}: Internal Server Error`
		);
	});

	it('should throw server error when status is 503', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 503, text: 'Service Unavailable' });

		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Server error (HTTP 503) from ${url}: Service Unavailable`
		);
	});

	it('should throw client error when status is 400', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 400, text: 'Bad Request' });

		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Client error (HTTP 400) from ${url}: Bad Request`
		);
	});

	it('should throw client error when status is 401', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 401, text: 'Unauthorized' });

		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Client error (HTTP 401) from ${url}: Unauthorized`
		);
	});

	it('should throw client error when status is 404', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 404, text: 'Not Found' });

		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Client error (HTTP 404) from ${url}: Not Found`
		);
	});

	it('should throw client error when status is 429', async () => {
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 429, text: 'Rate Limit Exceeded' });

		await expect(sendRequest(url, headers, body)).rejects.toThrow(
			`Client error (HTTP 429) from ${url}: Rate Limit Exceeded`
		);
	});

	it('should rethrow native errors from requestUrl', async () => {
		const networkError = new Error('Network connection failed');
		(requestUrl as jest.Mock).mockRejectedValueOnce(networkError);

		await expect(sendRequest(url, headers, body)).rejects.toThrow('Network connection failed');
	});

	it('should convert non-Error exceptions to Error', async () => {
		(requestUrl as jest.Mock).mockRejectedValueOnce('string error');

		await expect(sendRequest(url, headers, body)).rejects.toThrow('string error');
	});
});
