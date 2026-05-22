export function escapeOAuthHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const baseStyles = `
	body {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		margin: 0;
	}
	.container {
		text-align: center;
		background: white;
		padding: 40px 60px;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.2);
	}
	h1 { margin-bottom: 10px; }
	p { color: #666; }
`;

export function buildOAuthSuccessHtml(): string {
	return `
<!DOCTYPE html>
<html>
<head>
	<title>Authorization Successful</title>
	<style>
		${baseStyles}
		body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
		h1 { color: #22c55e; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Authorization Successful!</h1>
		<p>You can close this window and return to Obsidian.</p>
	</div>
</body>
</html>`;
}

export function buildOAuthErrorHtml(message: string): string {
	const escapedMessage = escapeOAuthHtml(message);
	return `
<!DOCTYPE html>
<html>
<head>
	<title>Authorization Failed</title>
	<style>
		${baseStyles}
		body { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); }
		h1 { color: #dc2626; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Authorization Failed</h1>
		<p>${escapedMessage}</p>
		<p>Please close this window and try again.</p>
	</div>
</body>
</html>`;
}
