import type { RequestUrlParam } from 'obsidian';
import { requestUrl } from 'obsidian';
import https from 'https';

const STREAM_TIMEOUT_MS = 60000; // 60 seconds
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

/**
 * Generic SSE event type for streaming responses
 */
export interface SSEEvent {
	type: string;
	[key: string]: unknown;
}

function maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(headers).map(([key, value]) =>
			key.toLowerCase().includes('authorization') ? [key, '[MASKED]'] : [key, value]
		)
	);
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
}

function parseSSEEvents(text: string): SSEEvent[] {
	const events: SSEEvent[] = [];

	for (const line of text.split('\n')) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine === 'data: [DONE]') {
			continue;
		}

		if (trimmedLine.startsWith('data: ')) {
			try {
				const jsonStr = trimmedLine.slice(6);
				const event = JSON.parse(jsonStr) as SSEEvent;
				events.push(event);
			} catch {
				// Skip non-JSON data lines
			}
		}
	}

	return events;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
	return RETRY_STATUS_CODES.includes(status);
}

export class HttpError extends Error {
	readonly status: number;
	readonly responseText: string;

	constructor(message: string, status: number, responseText: string) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
		this.responseText = responseText;
	}
}

async function sendStreamingRequestViaNode(
	url: string,
	headers: Record<string, string>,
	body: Record<string, unknown>,
	timeoutMs: number = STREAM_TIMEOUT_MS
): Promise<{ status: number; text: string }> {
	// https is imported at module level for proper testability

	const parsedUrl = new URL(url);
	const payload = JSON.stringify(body);
	const payloadLength = Buffer.byteLength(payload);

	return new Promise((resolve, reject) => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let isResolved = false;

		const cleanup = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};

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
					if (isResolved) return;
					isResolved = true;
					cleanup();
					const text = Buffer.concat(chunks).toString('utf8');
					resolve({
						status: response.statusCode ?? 0,
						text,
					});
				});
				response.on('error', (err) => {
					if (isResolved) return;
					isResolved = true;
					cleanup();
					reject(err);
				});
			}
		);

		// Set up timeout
		timeoutId = setTimeout(() => {
			if (isResolved) return;
			isResolved = true;
			request.destroy();
			reject(new Error(`Stream request timed out after ${timeoutMs}ms`));
		}, timeoutMs);

		request.on('error', (err) => {
			if (isResolved) return;
			isResolved = true;
			cleanup();
			reject(err);
		});

		request.write(payload);
		request.end();
	});
}

export async function sendStreamingRequest(
	url: string,
	headers: Record<string, string>,
	body: Record<string, unknown>,
	parseEvent: (event: SSEEvent) => string | null
): Promise<string> {
	console.log('[API Streaming Request]', {
		url,
		headers: maskSensitiveHeaders(headers),
		body,
	});

	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const response = await sendStreamingRequestViaNode(url, headers, body);

			// Check for HTTP errors
			if (response.status >= 400) {
				// Throw HttpError for 401 so it can be caught for token refresh
				if (response.status === 401) {
					throw new HttpError(`Authentication failed (HTTP 401)`, response.status, response.text);
				}

				// Check if we should retry for transient errors
				if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
					const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
					console.warn(
						`[API Streaming] Retryable error (HTTP ${response.status}), attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying in ${delayMs}ms`
					);
					await delay(delayMs);
					continue;
				}

				console.error('[API Streaming Error]', {
					status: response.status,
					url,
					responseText: response.text,
				});
				throw new HttpError(
					`Streaming request failed (HTTP ${response.status}): ${response.text}`,
					response.status,
					response.text
				);
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
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry 401 errors - they need token refresh, not retry
			if (error instanceof HttpError && error.status === 401) {
				throw error;
			}

			// Retry on network errors (not HTTP errors)
			if (!(error instanceof HttpError) && attempt < MAX_RETRIES) {
				const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
				console.warn(
					`[API Streaming] Network error, attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying in ${delayMs}ms:`,
					lastError.message
				);
				await delay(delayMs);
				continue;
			}

			// Re-throw HttpError as-is to preserve status info
			if (error instanceof HttpError) {
				throw error;
			}

			console.error('[API Streaming Error] Request failed:', lastError);
			throw new Error(`Streaming request failed: ${lastError.message}`);
		}
	}

	// Should not reach here, but TypeScript needs this for exhaustiveness
	throw lastError ?? new Error('Streaming request failed after all retries');
}
