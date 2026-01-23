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
 * Masks sensitive header values (e.g., Authorization) for safe logging
 */
const maskSensitiveHeaders = (headers: Record<string, string>): Record<string, string> => {
	return Object.fromEntries(
		Object.entries(headers).map(([key, value]) =>
			key.toLowerCase().includes('authorization') ? [key, '[MASKED]'] : [key, value]
		)
	);
};

/**
 * Creates standardized RequestUrlParam objects with enforced POST method
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

	console.log('[API Request]', {
		url: baseUrl,
		headers: maskSensitiveHeaders(headers),
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
 * Send streaming request using Node's https module.
 * Required for Codex API which needs streaming and proper error response handling.
 */
const sendStreamingRequestViaNode = async (
	url: string,
	headers: Record<string, string>,
	body: Record<string, unknown>
): Promise<{ status: number; text: string }> => {
	const https = require('https') as typeof import('https');

	const parsedUrl = new URL(url);
	const payload = JSON.stringify(body);
	const payloadLength = Buffer.byteLength(payload);

	return new Promise((resolve, reject) => {
		const request = https.request(
			{
				hostname: parsedUrl.hostname,
				port: Number(parsedUrl.port) || 443,
				path: parsedUrl.pathname + parsedUrl.search,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': payloadLength.toString(),
					...headers,
				},
			},
			(response) => {
				const chunks: Buffer[] = [];
				response.on('data', (chunk: Buffer) => chunks.push(chunk));
				response.on('end', () => {
					const text = Buffer.concat(chunks).toString('utf8');
					resolve({
						status: response.statusCode ?? 0,
						text,
					});
				});
				response.on('error', reject);
			}
		);

		request.on('error', reject);
		request.write(payload);
		request.end();
	});
};

/**
 * Send a streaming request and accumulate text from SSE events
 */
export const sendStreamingRequest = async (
	url: string,
	headers: Record<string, string>,
	body: Record<string, unknown>,
	parseEvent: (event: SSEEvent) => string | null
): Promise<string> => {
	console.log('[API Streaming Request]', {
		url,
		headers: maskSensitiveHeaders(headers),
		body,
	});

	let response: { status: number; text: string };

	try {
		response = await sendStreamingRequestViaNode(url, headers, body);
	} catch (error) {
		console.error('[API Streaming Error] Request failed:', error);
		throw new Error(
			`Streaming request failed: ${error instanceof Error ? error.message : String(error)}`
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
