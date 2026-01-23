import type { RequestUrlParam } from 'obsidian';
import { requestUrl } from 'obsidian';

/**
 * Creates standardized RequestUrlParam objects with enforced POST method
 * Implements convention-over-configuration to ensure API call consistency
 */
const getRequestParam = (
	url: string,
	headers: Record<string, string>,
	body: object
): RequestUrlParam => {
	return {
		url,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	};
};

export const sendRequest = async (
	baseUrl: string,
	headers: Record<string, string>,
	data: object
): Promise<unknown> => {
	const requestParam: RequestUrlParam = getRequestParam(baseUrl, headers, data);

	// 디버그: 요청 정보 로깅 (Authorization 마스킹)
	console.log('[API Request]', {
		url: baseUrl,
		headers: Object.fromEntries(
			Object.entries(headers).map(([k, v]) =>
				k.toLowerCase().includes('authorization') ? [k, '[MASKED]'] : [k, v]
			)
		),
		body: data,
	});

	let response: { status: number; text: string; json: unknown };

	try {
		response = await requestUrl(requestParam);
	} catch (error) {
		console.error('[API Error] Request failed:', error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(String(error));
	}

	if (response.status >= 500) {
		console.error('[API Error] Server error:', {
			status: response.status,
			response: response.json || response.text,
		});
		throw new Error(`Server error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	if (response.status >= 400) {
		console.error('[API Error] Client error:', {
			status: response.status,
			url: baseUrl,
			responseJson: response.json,
			responseText: response.text,
		});
		throw new Error(`Client error (HTTP ${response.status}) from ${baseUrl}: ${response.text}`);
	}

	return response.json;
};
