// eslint.config.mjs - Modern ESLint v9+ Flat Config

import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';
import unicorn from 'eslint-plugin-unicorn';

export default [
	js.configs.recommended,
	...ts.configs.recommended,

	// TypeScript files configuration
	{
		files: ['src/**/*.ts'],
		plugins: {
			sonarjs,
			import: importPlugin,
			boundaries,
			unicorn,
		},
		settings: {
			'boundaries/elements': [
				{
					type: 'api',
					pattern: 'src/api/**',
					mode: 'folder',
				},
				{
					type: 'ui',
					pattern: 'src/ui/**',
					mode: 'folder',
				},
				{
					type: 'frontmatter',
					pattern: 'src/frontmatter/**',
					mode: 'folder',
				},
				{
					type: 'utils',
					pattern: 'src/utils/**',
					mode: 'folder',
				},
				{
					type: 'main',
					pattern: 'src/main.ts',
					mode: 'file',
				},
			],
			'boundaries/rules': [
				{
					from: 'ui',
					disallow: ['api'],
					message: 'UI components should not directly import API modules',
				},
				{
					from: 'api',
					disallow: ['ui'],
					message: 'API modules should not import UI components',
				},
			],
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: ts.parser,
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				// Node.js globals
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
				global: 'readonly',
				// Browser globals (for Obsidian)
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
			},
		},
		rules: {
			// Original rules from .eslintrc
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off',

			// Allow any and require for existing code compatibility
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off',

			'no-fallthrough': 'error',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'warn',
			'@typescript-eslint/consistent-type-imports': 'error',
			'sonarjs/no-duplicate-string': 'warn',
			'import/no-cycle': 'error',
			'boundaries/element-types': 'warn',
			'unicorn/no-array-reduce': 'warn',
		},
	},

	// Global ignores
	{
		ignores: [
			'main.js',
			'node_modules/**',
			'dist/**',
			'*.d.ts',
			'__tests__/**',
			'__mocks__/**',
			'*.js',
			'*.mjs',
		],
	},

	// Prettier integration (must be last)
	prettier,
];
