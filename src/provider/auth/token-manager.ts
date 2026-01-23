import { CODEX_OAUTH } from './oauth-constants';
import type { OAuthTokens, TokenResponse } from './types';

/**
 * Parse JWT claims without verification (for extracting account_id)
 * Note: This does NOT verify the signature - use only for non-security-critical claims
 */
export function parseJwtClaims(token: string): Record<string, unknown> {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT format');
	}

	const payload = parts[1];
	// Handle base64url to base64 conversion
	const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

	try {
		const decoded = atob(padded);
		return JSON.parse(decoded);
	} catch {
		throw new Error('Failed to decode JWT payload');
	}
}

/**
 * Extract account_id from an access token
 */
export function extractAccountId(accessToken: string): string {
	const claims = parseJwtClaims(accessToken);

	// OpenAI tokens use 'https://api.openai.com/auth' namespace for custom claims
	const authClaims = claims['https://api.openai.com/auth'] as Record<string, unknown> | undefined;
	const accountId = authClaims?.['user_id'] as string | undefined;

	if (!accountId) {
		// Fallback to 'sub' claim
		const sub = claims['sub'] as string | undefined;
		if (!sub) {
			throw new Error('Could not extract account ID from token');
		}
		return sub;
	}

	return accountId;
}

/**
 * Check if tokens are expired or about to expire
 * @param tokens The OAuth tokens to check
 * @param bufferSeconds How many seconds before expiry to consider "expired" (default: 5 minutes)
 */
export function isTokenExpired(tokens: OAuthTokens, bufferSeconds?: number): boolean {
	const buffer = bufferSeconds ?? CODEX_OAUTH.TOKEN_REFRESH_BUFFER_SECONDS;
	const expiresWithBuffer = tokens.expiresAt - buffer;
	return Date.now() / 1000 >= expiresWithBuffer;
}

/**
 * Create OAuthTokens from a token response
 */
export function createTokensFromResponse(response: TokenResponse): OAuthTokens {
	const accessToken = response.access_token;
	const accountId = extractAccountId(accessToken);

	return {
		accessToken,
		refreshToken: response.refresh_token,
		expiresAt: Math.floor(Date.now() / 1000) + response.expires_in,
		accountId,
	};
}

/**
 * Calculate remaining time until token expires
 * @returns Remaining time in seconds, or 0 if expired
 */
export function getTokenRemainingTime(tokens: OAuthTokens): number {
	const remaining = tokens.expiresAt - Math.floor(Date.now() / 1000);
	return Math.max(0, remaining);
}

/**
 * Format remaining time for display
 */
export function formatTokenExpiry(tokens: OAuthTokens): string {
	const remaining = getTokenRemainingTime(tokens);

	if (remaining <= 0) {
		return 'Expired';
	}

	const hours = Math.floor(remaining / 3600);
	const minutes = Math.floor((remaining % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m remaining`;
	}
	return `${minutes}m remaining`;
}
