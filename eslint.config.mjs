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
			// Module boundary definitions
			// Structure: provider/ | classifier/ | settings/ | lib/
			'boundaries/elements': [
				{
					type: 'provider',
					pattern: 'src/provider/**',
					mode: 'folder',
				},
				{
					type: 'classifier',
					pattern: 'src/classifier/**',
					mode: 'folder',
				},
				{
					type: 'settings',
					pattern: 'src/settings/**',
					mode: 'folder',
				},
				{
					type: 'lib',
					pattern: 'src/lib/**',
					mode: 'folder',
				},
				{
					type: 'main',
					pattern: 'src/main.ts',
					mode: 'file',
				},
			],
			// Dependency rules between modules
			'boundaries/rules': [
				{
					from: 'settings',
					disallow: ['provider'],
					message: 'settings cannot import provider directly. Use classifier instead.',
				},
				{
					from: 'provider',
					disallow: ['settings', 'classifier'],
					message: 'provider is pure API layer. No UI/business logic dependency.',
				},
				{
					from: 'lib',
					disallow: ['provider', 'classifier', 'settings'],
					message: 'lib is pure utility. No domain module dependency.',
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
			// Disable base rules (use TypeScript versions)
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off',

			// Legacy compatibility
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off',

			// Type safety
			'no-fallthrough': 'error',
			'@typescript-eslint/no-floating-promises': 'warn',

			// Return type: required for declarations, optional for callbacks
			'@typescript-eslint/explicit-function-return-type': [
				'warn',
				{
					allowExpressions: true,
					allowHigherOrderFunctions: true,
					allowTypedFunctionExpressions: true,
				},
			],

			// Code quality
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
