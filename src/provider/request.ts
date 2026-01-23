import type { RequestUrlParam } from 'obsidian';
import { requestUrl } from 'obsidian';

/**
 * Generic SSE event type for streaming responses
 */
export interface SSEEvent {
	type: string;
	[key: string]: unknown;
}

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

/**
 * Parse SSE (Server-Sent Events) text into individual events
 */
const parseSSEEvents = (text: string): SSEEvent[] => {
	const events: SSEEvent[] = [];
	const lines = text.split('\n');

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine === 'data: [DONE]') {
			continue;
		}

		if (trimmedLine.startsWith('data: ')) {
			try {
				const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
				const event = JSON.parse(jsonStr) as SSEEvent;
				events.push(event);
			} catch {
				// Skip non-JSON data lines
			}
		}
	}

	return events;
};

/**
 * Extract error details from requestUrl exceptions
 * Obsidian's requestUrl throws on 4xx/5xx with limited info
 */
const extractErrorDetails = (error: unknown): { status?: number; message: string } => {
	if (error instanceof Error) {
		// Try to extract status from error message (e.g., "Request failed, status 400")
		const statusMatch = error.message.match(/status\s*(\d{3})/i);
		const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
		return { status, message: error.message };
	}

	// Check if error object has useful properties
	if (typeof error === 'object' && error !== null) {
		const err = error as Record<string, unknown>;
		return {
			status: typeof err.status === 'number' ? err.status : undefined,
			message: String(err.message || err.error || JSON.stringify(error)),
		};
	}

	return { message: String(error) };
};

/**
 * Send a streaming request and accumulate text from SSE events
 * Uses provider-specific event parser to extract text deltas
 * Uses Obsidian's requestUrl for CORS bypass with enhanced error handling
 */
export const sendStreamingRequest = async (
	url: string,
	headers: Record<string, string>,
	body: Record<string, unknown>,
	parseEvent: (event: SSEEvent) => string | null
): Promise<string> => {
	console.log('[API Streaming Request]', {
		url,
		headers: Object.fromEntries(
			Object.entries(headers).map(([k, v]) =>
				k.toLowerCase().includes('authorization') ? [k, '[MASKED]'] : [k, v]
			)
		),
		body,
	});

	let response: { status: number; text: string };

	try {
		response = await requestUrl({
			url,
			method: 'POST',
			headers: {
				...headers,
				Accept: 'text/event-stream',
			},
			body: JSON.stringify(body),
		});
	} catch (error) {
		// requestUrl throws on 4xx/5xx errors - extract what info we can
		const errorDetails = extractErrorDetails(error);
		console.error('[API Streaming Error] Request threw:', {
			url,
			status: errorDetails.status,
			message: errorDetails.message,
			rawError: error,
		});
		throw new Error(
			`Streaming request failed${errorDetails.status ? ` (HTTP ${errorDetails.status})` : ''}: ${errorDetails.message}`
		);
	}

	if (response.status >= 400) {
		console.error('[API Streaming Error]', {
			status: response.status,
			url,
			responseText: response.text,
		});
		throw new Error(`Streaming request failed (HTTP ${response.status}): ${response.text}`);
	}

	// Parse SSE events from response text
	const events = parseSSEEvents(response.text);
	let accumulatedText = '';

	for (const event of events) {
		// Check for error events
		if (event.type === 'error') {
			throw new Error(`Stream error: ${event.message || JSON.stringify(event)}`);
		}

		const textDelta = parseEvent(event);
		if (textDelta !== null) {
			accumulatedText += textDelta;
		}
	}

	console.log('[API Streaming Response] Accumulated text length:', accumulatedText.length);
	return accumulatedText;
};
