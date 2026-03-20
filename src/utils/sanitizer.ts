/**
 * Sanitize user input to prevent prompt injection attacks.
 * Escapes special characters that could be used to manipulate prompt structure.
 */
export function sanitizePromptInput(input: string): string {
	if (!input) return '';

	// Escape characters that could be used to break out of intended context
	return input
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\{/g, '&#123;')
		.replace(/\}/g, '&#125;');
}

/**
 * Sanitize an array of reference values for use in prompts.
 */
export function sanitizeReferenceValues(values: readonly string[]): string[] {
	return values.map((value) => sanitizePromptInput(value));
}
