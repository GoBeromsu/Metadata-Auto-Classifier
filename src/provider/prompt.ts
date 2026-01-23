import { DEFAULT_TASK_TEMPLATE } from '../constants';
import { sanitizePromptInput, sanitizeReferenceValues } from '../lib/sanitizer';

// Constants for system behaviour
export const DEFAULT_SYSTEM_ROLE = `You are a JSON classification assistant. Respond only with a valid JSON object adhering to the specified schema.`;

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

	// Sanitize user-provided inputs to prevent prompt injection
	const sanitizedReference = sanitizeReferenceValues(reference);
	const sanitizedCustomQuery = sanitizePromptInput(customQuery);

	const completePrompt =
		customTemplate +
		outputStructureTemplate
			.replace('{minCount}', String(count.min))
			.replace('{maxCount}', String(count.max))
			.replace('{reference}', sanitizedReference.join(', '))
			.replace('{input}', input)
			.replace('{customQuery}', sanitizedCustomQuery);

	return completePrompt;
}
