export const DEFAULT_CHAT_ROLE = `You are a JSON answer bot. Don't answer other words.`;

export const DEFAULT_PROMPT_TEMPLATE = `Classify the given content using the provided reference categories.

Instructions:
1. Use ONLY the categories provided in the reference list below.
2. Do not modify, remove, or add any formatting to the reference categories (e.g., keep '[[]]' if present).
3. Select up to {{tagCount}} categories based on relevance and similarity to the content. Choose fewer if appropriate.
4. Even if you're unsure, make a selection and adjust the reliability score accordingly.
5. Provide your answer in valid JSON format.

Reference categories:
{{reference}}

Input:
"""
{{input}}
"""
`;

// Generate a prompt template based on the given parameters
export function getPromptTemplate(
	tagCount: number,
	input: string,
	reference: readonly string[]
): string {
	let template = DEFAULT_PROMPT_TEMPLATE;
	template = template.replace(/{{tagCount}}/g, tagCount.toString());
	template = template.replace('{{reference}}', reference.join(', '));
	template = template.replace('{{input}}', input);

	return template;
}
