export const DEFAULT_CHAT_ROLE = `You are a JSON answer bot. Don't answer other words.`;

export const DEFAULT_PROMPT_TEMPLATE = `Classify the given content using the provided reference categories.

Instructions:
1. Use ONLY the categories provided in the reference list below.
2. Do not modify, remove, or add any formatting to the reference categories (e.g., keep '[[]]' if present).
3. Select exactly {{tagCount}} categories that best fit the content.
4. Even if you're unsure, make a selection and adjust the reliability score accordingly.
5. Provide your answer in valid JSON format.

Reference categories:
{{reference}}

Example output:
{{dynamicExample}}

Answer in valid JSON format: {"reliability": number, "output": string[]}
The "reliability" should be a number between 0 and 1.
The "output" must be an array of exactly {{tagCount}} categories.
`;

export const DEFAULT_PROMPT_TEMPLATE_WO_REF = `Classify this content:
"""
{{input}}
"""
Answer in valid JSON format: {"reliability": number, "output": string[]}
The "reliability" should be a number between 0 and 1.
The "output" must be an array of exactly {{tagCount}} categories.
Even if you are not sure, qualify the reliability and recommend {{tagCount}} proper categories.
`;

export function getPromptTemplate(
	useRef: boolean,
	tagCount: number,
	input: string,
	reference?: string
): string {
	let template = useRef ? DEFAULT_PROMPT_TEMPLATE : DEFAULT_PROMPT_TEMPLATE_WO_REF;
	template = template.replace(/{{tagCount}}/g, tagCount.toString());
	if (useRef && reference) {
		const referenceArray = reference.split(',').map((item) => item.trim());
		const cleanedReferenceArray = referenceArray.map((item) =>
			item.replace(/^\s*\[\[/, '[[').replace(/\]\]\s*$/, ']]')
		);
		const exampleCount = Math.min(3, cleanedReferenceArray.length);
		const exampleReferences = cleanedReferenceArray.slice(0, exampleCount);

		const dynamicOutput = exampleReferences.map((ref) => `"${ref}"`).join(', ');

		const dynamicExample = `{
  "reliability": 0.8,
  "output": [${dynamicOutput}]
}`;

		template = template.replace('{{reference}}', cleanedReferenceArray.join('\n- '));
		template = template.replace('{{dynamicExample}}', dynamicExample);
	}
	template = template.replace('{{input}}', input);

	// Add logging for the prompt output
	console.log('Generated Prompt Template:', template);

	return template;
}
