import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Platform, requestUrl } from 'obsidian';
import { CodexOAuth } from '../../../src/provider/auth/oauth';
import type { OAuthTokens } from '../../../src/provider/auth/types';
import { OAuthCallbackServer } from '../../../src/provider/auth/oauth-server';
import { createTokensFromResponse, isTokenExpired } from '../../../src/provider/auth/token-manager';
import type { Mock } from 'vitest';

// Mock obsidian
vi.mock('obsidian', () => ({
	Platform: {
		isDesktop: true,
	},
	requestUrl: vi.fn(),
}));

// Mock the oauth-server - use a class-like constructor mock
vi.mock('../../../src/provider/auth/oauth-server', () => {
	const MockServer = vi.fn(function (this: any) {
		this.waitForCallback = vi.fn();
		this.stop = vi.fn();
	});
	return { OAuthCallbackServer: MockServer };
});

// Mock pkce
vi.mock('../../../src/provider/auth/pkce', () => ({
	generatePKCEChallenge: vi.fn().mockResolvedValue({
		codeVerifier: 'test-verifier',
		codeChallenge: 'test-challenge',
	}),
	generateState: vi.fn().mockReturnValue('test-state'),
}));

// Mock token-manager
vi.mock('../../../src/provider/auth/token-manager', () => ({
	createTokensFromResponse: vi.fn().mockReturnValue({
		accessToken: 'new-access-token',
		refreshToken: 'new-refresh-token',
		expiresAt: Math.floor(Date.now() / 1000) + 3600,
		accountId: 'test-account-id',
	}),
	isTokenExpired: vi.fn().mockReturnValue(false),
}));

// Mock global window
const mockWindowOpen = vi.fn();
(global as any).window = {
	open: mockWindowOpen,
};

const MockOAuthCallbackServer = OAuthCallbackServer as unknown as Mock;

describe('CodexOAuth', () => {
	let codexOAuth: CodexOAuth;

	beforeEach(() => {
		vi.clearAllMocks();
		mockWindowOpen.mockClear();
		codexOAuth = new CodexOAuth();
	});

	describe('isSupported', () => {
		it('should return true on desktop platform', () => {
			(Platform as any).isDesktop = true;
			expect(CodexOAuth.isSupported()).toBe(true);
		});

		it('should return false on non-desktop platform', () => {
			(Platform as any).isDesktop = false;
			expect(CodexOAuth.isSupported()).toBe(false);
		});
	});

	describe('startAuthFlow', () => {
		it('should throw error on non-desktop platform', async () => {
			(Platform as any).isDesktop = false;

			await expect(codexOAuth.startAuthFlow()).rejects.toThrow(
				'OAuth is only supported on desktop platforms'
			);
		});

		it('should open browser and wait for callback on desktop', async () => {
			(Platform as any).isDesktop = true;

			const mockServer = {
				waitForCallback: vi.fn().mockResolvedValue({
					code: 'auth-code',
					state: 'test-state',
				}),
				stop: vi.fn(),
			};
			MockOAuthCallbackServer.mockImplementation(function (this: any) {
				Object.assign(this, mockServer);
			});

			// Mock requestUrl for token exchange
			(requestUrl as any).mockResolvedValue({
				status: 200,
				json: {
					access_token: 'access-token',
					refresh_token: 'refresh-token',
					expires_in: 3600,
					token_type: 'Bearer',
				},
			});

			const tokens = await codexOAuth.startAuthFlow();

			// Verify flow
			expect(mockWindowOpen).toHaveBeenCalled();
			expect(mockServer.waitForCallback).toHaveBeenCalledWith('test-state');
			expect(requestUrl).toHaveBeenCalled();
			expect(tokens).toBeDefined();
			expect(tokens.accessToken).toBe('new-access-token');
		});

		it('should stop server on error', async () => {
			(Platform as any).isDesktop = true;

			const mockServer = {
				waitForCallback: vi.fn().mockRejectedValue(new Error('Callback timeout')),
				stop: vi.fn(),
			};
			MockOAuthCallbackServer.mockImplementation(function (this: any) {
				Object.assign(this, mockServer);
			});

			await expect(codexOAuth.startAuthFlow()).rejects.toThrow('Callback timeout');
			expect(mockServer.stop).toHaveBeenCalled();
		});
	});

	describe('refreshTokens', () => {
		const existingTokens: OAuthTokens = {
			accessToken: 'old-access-token',
			refreshToken: 'old-refresh-token',
			expiresAt: Math.floor(Date.now() / 1000) - 100, // Expired
			accountId: 'account-id',
		};

		it('should refresh tokens successfully', async () => {
			(requestUrl as any).mockResolvedValue({
				status: 200,
				json: {
					access_token: 'refreshed-access-token',
					refresh_token: 'refreshed-refresh-token',
					expires_in: 3600,
					token_type: 'Bearer',
				},
			});

			const newTokens = await codexOAuth.refreshTokens(existingTokens);

			expect(requestUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				})
			);
			expect(newTokens).toBeDefined();
		});

		it('should throw error on refresh failure', async () => {
			(requestUrl as any).mockResolvedValue({
				status: 400,
				json: {
					error: 'invalid_grant',
					error_description: 'Refresh token expired',
				},
			});

			await expect(codexOAuth.refreshTokens(existingTokens)).rejects.toThrow(
				'Token refresh failed'
			);
		});

		it('should preserve original refresh token if new one not provided', async () => {

			// Mock to return tokens without refresh token
			createTokensFromResponse.mockReturnValueOnce({
				accessToken: 'new-access',
				refreshToken: '', // Empty
				expiresAt: Math.floor(Date.now() / 1000) + 3600,
				accountId: 'account-id',
			});

			(requestUrl as any).mockResolvedValue({
				status: 200,
				json: {
					access_token: 'new-access',
					expires_in: 3600,
					token_type: 'Bearer',
					// No refresh_token in response
				},
			});

			const newTokens = await codexOAuth.refreshTokens(existingTokens);

			expect(newTokens.refreshToken).toBe('old-refresh-token');
		});

		it('should preserve original account ID if extraction fails', async () => {

			// Mock to return tokens without account ID
			createTokensFromResponse.mockReturnValueOnce({
				accessToken: 'new-access',
				refreshToken: 'new-refresh',
				expiresAt: Math.floor(Date.now() / 1000) + 3600,
				accountId: '', // Empty
			});

			(requestUrl as any).mockResolvedValue({
				status: 200,
				json: {
					access_token: 'new-access',
					refresh_token: 'new-refresh',
					expires_in: 3600,
					token_type: 'Bearer',
				},
			});

			const newTokens = await codexOAuth.refreshTokens(existingTokens);

			expect(newTokens.accountId).toBe('account-id');
		});
	});

	describe('refreshTokensIfNeeded', () => {
		const validTokens: OAuthTokens = {
			accessToken: 'valid-access-token',
			refreshToken: 'valid-refresh-token',
			expiresAt: Math.floor(Date.now() / 1000) + 3600,
			accountId: 'account-id',
		};

		it('should return original tokens if not expired', async () => {
			isTokenExpired.mockReturnValue(false);

			const result = await codexOAuth.refreshTokensIfNeeded(validTokens);

			expect(result).toBe(validTokens);
			expect(requestUrl).not.toHaveBeenCalled();
		});

		it('should refresh tokens if expired', async () => {
			isTokenExpired.mockReturnValue(true);

			(requestUrl as any).mockResolvedValue({
				status: 200,
				json: {
					access_token: 'new-access',
					refresh_token: 'new-refresh',
					expires_in: 3600,
					token_type: 'Bearer',
				},
			});

			const result = await codexOAuth.refreshTokensIfNeeded(validTokens);

			expect(result.accessToken).toBe('new-access-token');
			expect(requestUrl).toHaveBeenCalled();
		});
	});

	describe('cancelFlow', () => {
		it('should stop callback server if running', async () => {
			(Platform as any).isDesktop = true;

			const mockServer = {
				waitForCallback: vi.fn().mockImplementation(
					() => new Promise(() => {}) // Never resolves
				),
				stop: vi.fn(),
			};
			MockOAuthCallbackServer.mockImplementation(function (this: any) {
				Object.assign(this, mockServer);
			});

			// Start flow but don't await
			const flowPromise = codexOAuth.startAuthFlow();

			// Wait a tick for the server to be created
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Cancel
			codexOAuth.cancelFlow();

			expect(mockServer.stop).toHaveBeenCalled();
		});

		it('should do nothing if no flow is running', () => {
			// Should not throw
			expect(() => codexOAuth.cancelFlow()).not.toThrow();
		});
	});
});
