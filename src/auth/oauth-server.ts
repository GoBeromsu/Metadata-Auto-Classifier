import type { IncomingMessage, Server, ServerResponse } from 'http';
import { createServer } from 'http';
import { CODEX_OAUTH } from './codex-constants';
import type { OAuthCallbackResponse } from './types';

/**
 * Local OAuth callback server for handling the authorization code redirect
 * Runs on localhost:1455 as required by OpenAI
 */
export class OAuthCallbackServer {
	private server: Server | null = null;
	private resolveCallback: ((response: OAuthCallbackResponse) => void) | null = null;
	private rejectCallback: ((error: Error) => void) | null = null;

	/**
	 * Start the callback server and wait for the authorization code
	 * @param expectedState The state parameter to validate against CSRF attacks
	 * @param timeoutMs Timeout in milliseconds (default: 5 minutes)
	 */
	async waitForCallback(
		expectedState: string,
		timeoutMs: number = 300000
	): Promise<OAuthCallbackResponse> {
		return new Promise((resolve, reject) => {
			this.resolveCallback = resolve;
			this.rejectCallback = reject;

			const timeout = setTimeout(() => {
				this.stop();
				reject(new Error('OAuth callback timeout - no response received'));
			}, timeoutMs);

			this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
				this.handleRequest(req, res, expectedState, timeout);
			});

			this.server.on('error', (err: Error) => {
				clearTimeout(timeout);
				this.stop();
				if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
					reject(
						new Error(
							`Port ${CODEX_OAUTH.REDIRECT_PORT} is already in use. Please close any application using this port.`
						)
					);
				} else {
					reject(err);
				}
			});

			this.server.listen(CODEX_OAUTH.REDIRECT_PORT, '127.0.0.1', () => {
				console.log(`OAuth callback server listening on port ${CODEX_OAUTH.REDIRECT_PORT}`);
			});
		});
	}

	/**
	 * Handle incoming HTTP requests
	 */
	private handleRequest(
		req: IncomingMessage,
		res: ServerResponse,
		expectedState: string,
		timeout: NodeJS.Timeout
	): void {
		const url = new URL(req.url || '/', `http://localhost:${CODEX_OAUTH.REDIRECT_PORT}`);

		// Only handle the callback path
		if (url.pathname !== '/auth/callback') {
			res.writeHead(404);
			res.end('Not Found');
			return;
		}

		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
		const error = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description');

		// Handle OAuth errors
		if (error) {
			clearTimeout(timeout);
			this.sendErrorResponse(res, `OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
			this.rejectCallback?.(
				new Error(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`)
			);
			this.stop();
			return;
		}

		// Validate state to prevent CSRF
		if (state !== expectedState) {
			clearTimeout(timeout);
			this.sendErrorResponse(res, 'Invalid state parameter - possible CSRF attack');
			this.rejectCallback?.(new Error('Invalid state parameter - possible CSRF attack'));
			this.stop();
			return;
		}

		// Validate code presence
		if (!code) {
			clearTimeout(timeout);
			this.sendErrorResponse(res, 'No authorization code received');
			this.rejectCallback?.(new Error('No authorization code received'));
			this.stop();
			return;
		}

		// Success!
		clearTimeout(timeout);
		this.sendSuccessResponse(res);
		this.resolveCallback?.({ code, state });
		this.stop();
	}

	/**
	 * Send success HTML response
	 */
	private sendSuccessResponse(res: ServerResponse): void {
		const html = `
<!DOCTYPE html>
<html>
<head>
	<title>Authorization Successful</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		}
		.container {
			text-align: center;
			background: white;
			padding: 40px 60px;
			border-radius: 16px;
			box-shadow: 0 10px 40px rgba(0,0,0,0.2);
		}
		h1 { color: #22c55e; margin-bottom: 10px; }
		p { color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Authorization Successful!</h1>
		<p>You can close this window and return to Obsidian.</p>
	</div>
</body>
</html>`;
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(html);
	}

	/**
	 * Send error HTML response
	 */
	private sendErrorResponse(res: ServerResponse, message: string): void {
		const html = `
<!DOCTYPE html>
<html>
<head>
	<title>Authorization Failed</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
		}
		.container {
			text-align: center;
			background: white;
			padding: 40px 60px;
			border-radius: 16px;
			box-shadow: 0 10px 40px rgba(0,0,0,0.2);
		}
		h1 { color: #dc2626; margin-bottom: 10px; }
		p { color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Authorization Failed</h1>
		<p>${message}</p>
		<p>Please close this window and try again.</p>
	</div>
</body>
</html>`;
		res.writeHead(400, { 'Content-Type': 'text/html' });
		res.end(html);
	}

	/**
	 * Stop the callback server
	 */
	stop(): void {
		if (this.server) {
			this.server.close();
			this.server = null;
			console.log('OAuth callback server stopped');
		}
	}
}
