// Constants for system behaviour and default prompt template
export const DEFAULT_SYSTEM_ROLE = `You are a JSON classification assistant. Respond only with a valid JSON object adhering to the specified schema.`;

export const DEFAULT_TASK_TEMPLATE = `<task>
Classify the following content using the provided reference categories.
</task>

<instructions>
1. Select only from the reference categories listed.
2. Preserve the exact formatting of the reference categories, including brackets.
3. Assign a "reliability" score between 0 and 1 to each selected category, indicating confidence in the classification.
4. Maintain the full hierarchical structure for nested categories. (e.g. category/subcategory)
</instructions>

<plain_example>
{
	"output": ["machine learning", "natural language processing"],
	"reliability": 0.87
}
</plain_example>	
<wikilink_example>
{
	"output": ["[[Large Language Model]]", "[[Prompt Engineering]]"],
	"reliability": 0.92
}
</wikilink_example>
`;

export function getPromptTemplate(
	count: { min: number; max: number },
	input: string,
	reference: readonly string[],
	customQuery: string,
	customTemplate: string = DEFAULT_TASK_TEMPLATE
): string {
	const outputStructureTemplate = `
	<count instruction>
    Limit your selection between {minCount} and {maxCount} categories, choosing fewer if appropriate.
	</count_instruction>

	<output_format>
	{
	  "output": string[],
	  "reliability": number
	}
	</output_format>

	<reference_categories>
	{reference}
	</reference_categories>

	<classification_context>
	{customQuery}
	</classification_context>

	<content>
	{input}
	</content>
	`;

	const completePrompt =
		customTemplate +
		outputStructureTemplate
			.replace('{minCount}', String(count.min))
			.replace('{maxCount}', String(count.max))
			.replace('{reference}', reference.join(', '))
			.replace('{input}', input)
			.replace('{customQuery}', customQuery);

	return completePrompt;
}
