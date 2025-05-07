// Constants for system behaviour and default prompt template
export const DEFAULT_SYSTEM_ROLE = `You are a JSON classification assistant. Respond only with a valid JSON object.`;

export const DEFAULT_PROMPT_TEMPLATE = `Classify the following content using the reference categories provided.

Instructions:
1. Use **only** the categories listed in the reference.
2. Do not modify, remove, or add any formatting to the reference categories (e.g., preserve brackets such as '[[]]').
3. The tagCount limit must be followed conservatively. Do not choose more unless absolutely necessary.
4. For each selected category, assign a "reliability" score between **0 and 1**, reflecting confidence in the classification (1 = certain, 0 = very unsure).
5. **Nested categories are allowed.** Preserve full hierarchical structure when selecting nested tags.
`;

export function getPromptTemplate(
	tagCount: number,
	input: string,
	reference: readonly string[],
	customTemplate: string = DEFAULT_PROMPT_TEMPLATE
): string {
	const referenceSection = `- Select **up to ${tagCount}** categories that are most relevant. If fewer categories are appropriate, select fewer.  
Reference categories:  
${reference.join(', ')}

Content:
"""
${input}
"""
`;
	return `${customTemplate}\n\n${referenceSection}`;
}
