import type { PKCEChallenge } from './types';

/**
 * Generate a cryptographically secure random string for PKCE code verifier
 * RFC 7636 requires 43-128 characters from unreserved URI characters
 */
export function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return base64UrlEncode(array);
}

/**
 * Generate a code challenge from the verifier using SHA-256
 * RFC 7636 S256 method
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate a cryptographically secure state parameter for CSRF protection
 */
export function generateState(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return base64UrlEncode(array);
}

/**
 * Generate a complete PKCE challenge pair
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	return { codeVerifier, codeChallenge };
}

/**
 * Base64 URL encode without padding (RFC 7636 Appendix A)
 */
function base64UrlEncode(buffer: Uint8Array): string {
	const base64 = btoa(String.fromCharCode(...buffer));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
