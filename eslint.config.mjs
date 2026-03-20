// eslint.config.mjs - Modern ESLint v9+ Flat Config

import { baseConfig } from './eslint.base.js';
import prettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';
import unicorn from 'eslint-plugin-unicorn';

export default [
	...baseConfig,

	// MAC-specific: module boundary enforcement, code quality plugins
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
			parser: (await import('typescript-eslint')).parser,
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
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

	// Extended ignores (beyond baseConfig)
	{
		ignores: [
			'__tests__/**',
			'__mocks__/**',
		],
	},

	// Prettier integration (must be last)
	prettier,
];
