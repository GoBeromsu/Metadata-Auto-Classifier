export const DEFAULT_CHAT_ROLE = `You are a JSON answer bot. Don't answer other words.`;

export const DEFAULT_PROMPT_TEMPLATE = `Classify this content:
"""
{{input}}
"""
Answer format is JSON {reliability:0~1, output:string[]}. 
Even if you are not sure, qualify the reliability and select categories.
Output must be an array of {{tagCount}} categories.

{{reference}}
`;

export const DEFAULT_PROMPT_TEMPLATE_WO_REF = `Classify this content:
"""
{{input}}
"""
Answer format is JSON {reliability:0~1, output:string[]}. 
Even if you are not sure, qualify the reliability and recommend {{tagCount}} proper categories.
`;

export function getPromptTemplate(
	useRef: boolean,
	tagCount: number,
	input: string,
	reference?: string
): string {
	let template = useRef ? DEFAULT_PROMPT_TEMPLATE : DEFAULT_PROMPT_TEMPLATE_WO_REF;
	template = template.replace('{{tagCount}}', tagCount.toString());
	template = template.replace('{{input}}', input);
	if (useRef && reference) {
		template = template.replace('{{reference}}', reference);
	}
	return template;
}
