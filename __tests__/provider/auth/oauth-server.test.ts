import { buildOAuthErrorHtml, escapeOAuthHtml } from '../../../src/domain/auth/oauth-response-html';

describe('OAuth callback HTML responses', () => {
	it('escapes script-like error payloads before rendering HTML', () => {
		const payload = '<script>alert("xss")</script>';
		const html = buildOAuthErrorHtml(payload);

		expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
		expect(html).not.toContain(payload);
	});

	it('escapes quotes, angle brackets, and ampersands', () => {
		const payload = `bad "double" 'single' <tag attr="x"> & done`;
		const html = buildOAuthErrorHtml(payload);

		expect(html).toContain(
			'bad &quot;double&quot; &#39;single&#39; &lt;tag attr=&quot;x&quot;&gt; &amp; done'
		);
		expect(html).not.toContain('<tag attr="x">');
		expect(escapeOAuthHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
	});
});
