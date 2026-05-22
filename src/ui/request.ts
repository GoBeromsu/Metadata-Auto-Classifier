import type { RequestUrlParam } from 'obsidian';
import { requestUrl } from 'obsidian';
import { macLogger } from '../utils/mac-logger';
import { redactLogPayload, sanitizeErrorMessage } from '../utils/log-redaction';

function redactUrl(url: string): string {
	try {
		const parsed = new URL(url);
		let changed = false;
		for (const key of parsed.searchParams.keys()) {
			if (/key|token|secret|code/i.test(key)) {
				parsed.searchParams.set(key, '[REDACTED]');
				changed = true;
			}
		}
		return changed ? parsed.toString() : url;
	} catch {
		return sanitizeErrorMessage(url);
	}
}

function createRequestParam(
	url: string,
	headers: Record<string, string>,
	body: object
): RequestUrlParam {
	return {
		url,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	};
}

export async function sendRequest(
	baseUrl: string,
	headers: Record<string, string>,
	data: object
): Promise<unknown> {
	const requestParam = createRequestParam(baseUrl, headers, data);

	macLogger.debug(
		'[API Request]',
		redactLogPayload({
			url: redactUrl(baseUrl),
			headers,
			body: data,
		})
	);

	let response: { status: number; text: string; json: unknown };

	try {
		response = await requestUrl(requestParam);
	} catch (error) {
		macLogger.error('[API Error] Request failed', error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(String(error));
	}

	if (response.status >= 500) {
		macLogger.error(
			'[API Error] Server error',
			new Error(`HTTP ${response.status}: ${sanitizeErrorMessage(response.text)}`)
		);
		throw new Error(
			`Server error (HTTP ${response.status}) from ${redactUrl(baseUrl)}: ${sanitizeErrorMessage(response.text)}`
		);
	}

	if (response.status >= 400) {
		macLogger.error(
			'[API Error] Client error',
			new Error(
				`HTTP ${response.status} from ${redactUrl(baseUrl)}: ${sanitizeErrorMessage(response.text)}`
			)
		);
		throw new Error(
			`Client error (HTTP ${response.status}) from ${redactUrl(baseUrl)}: ${sanitizeErrorMessage(response.text)}`
		);
	}

	return response.json;
}

export { HttpError, sendStreamingRequest } from './streaming-request';
export type { SSEEvent } from './streaming-request';
