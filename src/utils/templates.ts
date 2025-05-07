export const DEFAULT_SYSTEM_ROLE = `You are a JSON classification assistant. Respond only with a valid JSON object.`;

export const DEFAULT_PROMPT_TEMPLATE = `Classify the given content using the provided reference categories.

Instructions:
1. Use ONLY the categories provided in the reference list below.
2. Do not modify, remove, or add any formatting to the reference categories (e.g., keep '[[]]' if present).
3. Select up to {{tagCount}} categories based on relevance and similarity to the content. Choose fewer if appropriate.
4. Even if you're unsure, make a selection and adjust the reliability score accordingly.
5. Provide your answer in valid JSON format.
6. Nested categories (e.g., [[Parent > Child]]) are allowed

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
	reference: readonly string[],
	customPromptTemplate?: string
): string {
	// Use DEFAULT_PROMPT_TEMPLATE if customPromptTemplate is not provided or empty
	const template = customPromptTemplate ? customPromptTemplate : DEFAULT_PROMPT_TEMPLATE;

	// Apply replacements
	let processedTemplate = template.replace(/{{tagCount}}/g, tagCount.toString());
	processedTemplate = processedTemplate.replace('{{reference}}', reference.join(', '));
	processedTemplate = processedTemplate.replace('{{input}}', input);

	return processedTemplate;
}
