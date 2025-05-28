// eslint.config.mjs - Modern ESLint v9+ Flat Config

import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	...ts.configs.recommended,

	// TypeScript files configuration
	{
		files: ['src/**/*.ts'],
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
