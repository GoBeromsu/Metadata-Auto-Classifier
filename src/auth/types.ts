/**
 * OAuth token data structure for Codex authentication
 */
export interface OAuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
	accountId: string;
}

/**
 * PKCE challenge data for OAuth flow
 */
export interface PKCEChallenge {
	codeVerifier: string;
	codeChallenge: string;
}

/**
 * OAuth callback response
 */
export interface OAuthCallbackResponse {
	code: string;
	state: string;
}

/**
 * Token exchange response from OpenAI
 */
export interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}
