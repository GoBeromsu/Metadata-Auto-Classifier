import { DEFAULT_SYSTEM_ROLE, DEFAULT_TASK_TEMPLATE, getPromptTemplate } from '../../src/api/prompt';

describe('api/prompt', () => {
	describe('DEFAULT_SYSTEM_ROLE', () => {
		it('should be a non-empty string', () => {
			expect(typeof DEFAULT_SYSTEM_ROLE).toBe('string');
			expect(DEFAULT_SYSTEM_ROLE.length).toBeGreaterThan(0);
		});

		it('should contain JSON classification instructions', () => {
			expect(DEFAULT_SYSTEM_ROLE).toContain('JSON');
			expect(DEFAULT_SYSTEM_ROLE).toContain('classification');
		});
	});

	describe('DEFAULT_TASK_TEMPLATE', () => {
		it('should be a non-empty string', () => {
			expect(typeof DEFAULT_TASK_TEMPLATE).toBe('string');
			expect(DEFAULT_TASK_TEMPLATE.length).toBeGreaterThan(0);
		});

		it('should contain required sections', () => {
			expect(DEFAULT_TASK_TEMPLATE).toContain('<task>');
			expect(DEFAULT_TASK_TEMPLATE).toContain('<instructions>');
			expect(DEFAULT_TASK_TEMPLATE).toContain('<plain_example>');
			expect(DEFAULT_TASK_TEMPLATE).toContain('<wikilink_example>');
		});

		it('should contain example JSON structures', () => {
			expect(DEFAULT_TASK_TEMPLATE).toContain('"output"');
			expect(DEFAULT_TASK_TEMPLATE).toContain('"reliability"');
		});
	});

	describe('getPromptTemplate', () => {
		const defaultCount = { min: 1, max: 5 };
		const defaultInput = 'Test content to classify';
		const defaultReference = ['category1', 'category2', 'category3'];
		const defaultCustomQuery = 'Custom classification context';

		it('should return a non-empty string', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery);
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('should include the default task template', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('<task>');
			expect(result).toContain('<instructions>');
		});

		it('should replace minCount placeholder', () => {
			const count = { min: 2, max: 8 };
			const result = getPromptTemplate(count, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('2');
			expect(result).not.toContain('{minCount}');
		});

		it('should replace maxCount placeholder', () => {
			const count = { min: 1, max: 10 };
			const result = getPromptTemplate(count, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('10');
			expect(result).not.toContain('{maxCount}');
		});

		it('should include reference categories', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('category1');
			expect(result).toContain('category2');
			expect(result).toContain('category3');
		});

		it('should include the input content', () => {
			const input = 'Unique test content for classification';
			const result = getPromptTemplate(defaultCount, input, defaultReference, defaultCustomQuery);
			expect(result).toContain(input);
		});

		it('should include the custom query', () => {
			const customQuery = 'Specific classification rules for this context';
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, customQuery);
			expect(result).toContain(customQuery);
		});

		it('should use custom template when provided', () => {
			const customTemplate = '<custom>My custom template</custom>';
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery, customTemplate);
			expect(result).toContain('<custom>');
			expect(result).toContain('My custom template');
		});

		it('should include output format section', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('<output_format>');
			expect(result).toContain('"output": string[]');
			expect(result).toContain('"reliability": number');
		});

		it('should include reference categories section', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('<reference_categories>');
		});

		it('should include content section', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('<content>');
		});

		it('should handle empty reference array', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, [], defaultCustomQuery);
			expect(result).toContain('<reference_categories>');
			expect(result).not.toContain('{reference}');
		});

		it('should handle empty input string', () => {
			const result = getPromptTemplate(defaultCount, '', defaultReference, defaultCustomQuery);
			expect(result).toContain('<content>');
			expect(result).not.toContain('{input}');
		});

		it('should handle empty custom query', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, '');
			expect(result).toContain('<classification_context>');
			expect(result).not.toContain('{customQuery}');
		});

		it('should handle special characters in input', () => {
			const specialInput = 'Content with <special> & "characters" and {braces}';
			const result = getPromptTemplate(defaultCount, specialInput, defaultReference, defaultCustomQuery);
			expect(result).toContain(specialInput);
		});

		it('should handle multiline input', () => {
			const multilineInput = 'Line 1\nLine 2\nLine 3';
			const result = getPromptTemplate(defaultCount, multilineInput, defaultReference, defaultCustomQuery);
			expect(result).toContain('Line 1');
			expect(result).toContain('Line 2');
			expect(result).toContain('Line 3');
		});

		it('should join reference categories with comma and space', () => {
			const refs = ['cat1', 'cat2', 'cat3'];
			const result = getPromptTemplate(defaultCount, defaultInput, refs, defaultCustomQuery);
			expect(result).toContain('cat1, cat2, cat3');
		});

		it('should handle single reference category', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, ['onlyOne'], defaultCustomQuery);
			expect(result).toContain('onlyOne');
		});

		it('should not modify input parameters', () => {
			const count = { min: 1, max: 5 };
			const reference = ['a', 'b'];
			const originalCount = { ...count };
			const originalReference = [...reference];

			getPromptTemplate(count, defaultInput, reference, defaultCustomQuery);

			expect(count).toEqual(originalCount);
			expect(reference).toEqual(originalReference);
		});
	});
});
