import { getPromptTemplate } from '../../src/api/prompt';

describe('api/prompt', () => {
	describe('getPromptTemplate', () => {
		const defaultCount = { min: 1, max: 5 };
		const defaultInput = 'Test content to classify';
		const defaultReference = ['category1', 'category2', 'category3'];
		const defaultCustomQuery = 'Custom classification context';

		it('should replace all placeholders with provided values', () => {
			const count = { min: 2, max: 10 };
			const result = getPromptTemplate(count, defaultInput, defaultReference, defaultCustomQuery);

			expect(result).toContain('2');
			expect(result).toContain('10');
			expect(result).toContain('category1, category2, category3');
			expect(result).toContain(defaultInput);
			expect(result).toContain(defaultCustomQuery);
			expect(result).not.toContain('{minCount}');
			expect(result).not.toContain('{maxCount}');
			expect(result).not.toContain('{reference}');
			expect(result).not.toContain('{input}');
			expect(result).not.toContain('{customQuery}');
		});

		it('should use custom template when provided', () => {
			const customTemplate = '<custom>My custom instructions</custom>';
			const result = getPromptTemplate(defaultCount, defaultInput, defaultReference, defaultCustomQuery, customTemplate);

			expect(result).toContain('<custom>My custom instructions</custom>');
			expect(result).toContain('<output_format>');
			expect(result).not.toContain('<task>');
		});

		it('should handle empty reference array', () => {
			const result = getPromptTemplate(defaultCount, defaultInput, [], defaultCustomQuery);

			expect(result).toContain('<reference_categories>');
			expect(result).toContain(defaultInput);
		});

		it('should handle special characters in input', () => {
			const specialInput = 'Content with <tags> and {braces} and "quotes"';
			const result = getPromptTemplate(defaultCount, specialInput, defaultReference, defaultCustomQuery);

			expect(result).toContain(specialInput);
		});
	});
});
