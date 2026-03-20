/**
 * Codex OAuth configuration constants
 * These values are specific to the OpenAI Codex API
 */

export const CODEX_OAUTH = {
	CLIENT_ID: 'app_EMoamEEZ73f0CkXaXp7hrann',
	ISSUER: 'https://auth.openai.com',
	REDIRECT_PORT: 1455,
	REDIRECT_URI: 'http://localhost:1455/auth/callback',
	API_ENDPOINT: 'https://chatgpt.com/backend-api/codex/responses',

	// OAuth endpoints derived from issuer
	get AUTHORIZATION_ENDPOINT() {
		return `${this.ISSUER}/oauth/authorize`;
	},
	get TOKEN_ENDPOINT() {
		return `${this.ISSUER}/oauth/token`;
	},

	// Scopes required for Codex API access
	SCOPES: ['openid', 'profile', 'email', 'offline_access'],

	// Token refresh buffer (5 minutes before expiry)
	TOKEN_REFRESH_BUFFER_SECONDS: 300,
} as const;
