import {
	generateCodeVerifier,
	generateCodeChallenge,
	generateState,
	generatePKCEChallenge,
} from '../../../src/provider/auth/pkce';

describe('pkce', () => {
	describe('generateCodeVerifier', () => {
		it('should generate a string of correct length', () => {
			const verifier = generateCodeVerifier();
			// 32 bytes base64url encoded = 43 characters (without padding)
			expect(verifier.length).toBeGreaterThanOrEqual(43);
		});

		it('should generate different verifiers each time', () => {
			const verifier1 = generateCodeVerifier();
			const verifier2 = generateCodeVerifier();
			expect(verifier1).not.toBe(verifier2);
		});

		it('should only contain URL-safe base64 characters', () => {
			const verifier = generateCodeVerifier();
			// Base64url: A-Z, a-z, 0-9, -, _
			expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
		});

		it('should not contain padding characters', () => {
			const verifier = generateCodeVerifier();
			expect(verifier).not.toContain('=');
		});
	});

	describe('generateCodeChallenge', () => {
		it('should generate a valid S256 challenge from verifier', async () => {
			const verifier = 'test-verifier-string';
			const challenge = await generateCodeChallenge(verifier);

			// SHA-256 hash base64url encoded = 43 characters
			expect(challenge.length).toBe(43);
			expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
		});

		it('should generate consistent challenge for same verifier', async () => {
			const verifier = 'consistent-verifier';
			const challenge1 = await generateCodeChallenge(verifier);
			const challenge2 = await generateCodeChallenge(verifier);

			expect(challenge1).toBe(challenge2);
		});

		it('should generate different challenges for different verifiers', async () => {
			const challenge1 = await generateCodeChallenge('verifier1');
			const challenge2 = await generateCodeChallenge('verifier2');

			expect(challenge1).not.toBe(challenge2);
		});
	});

	describe('generateState', () => {
		it('should generate a string for CSRF protection', () => {
			const state = generateState();
			// 16 bytes base64url encoded = 22 characters (without padding)
			expect(state.length).toBeGreaterThanOrEqual(22);
		});

		it('should generate different states each time', () => {
			const state1 = generateState();
			const state2 = generateState();
			expect(state1).not.toBe(state2);
		});

		it('should only contain URL-safe base64 characters', () => {
			const state = generateState();
			expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
		});
	});

	describe('generatePKCEChallenge', () => {
		it('should return both verifier and challenge', async () => {
			const pkce = await generatePKCEChallenge();

			expect(pkce.codeVerifier).toBeDefined();
			expect(pkce.codeChallenge).toBeDefined();
			expect(typeof pkce.codeVerifier).toBe('string');
			expect(typeof pkce.codeChallenge).toBe('string');
		});

		it('should generate valid PKCE pair', async () => {
			const pkce = await generatePKCEChallenge();

			// Verify that challenge is derived from verifier
			const expectedChallenge = await generateCodeChallenge(pkce.codeVerifier);
			expect(pkce.codeChallenge).toBe(expectedChallenge);
		});

		it('should generate different pairs each time', async () => {
			const pkce1 = await generatePKCEChallenge();
			const pkce2 = await generatePKCEChallenge();

			expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
			expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
		});
	});
});
