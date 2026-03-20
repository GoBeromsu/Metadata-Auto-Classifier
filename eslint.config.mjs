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
			// Module boundary definitions — 4-layer architecture
			// main → ui → domain → utils/types
			'boundaries/elements': [
				{
					type: 'main',
					pattern: 'src/main.ts',
					mode: 'file',
				},
				{
					type: 'ui',
					pattern: 'src/ui/**',
					mode: 'folder',
				},
				{
					type: 'domain',
					pattern: 'src/domain/**',
					mode: 'folder',
				},
				{
					type: 'utils',
					pattern: 'src/utils/**',
					mode: 'folder',
				},
				{
					type: 'types',
					pattern: 'src/types/**',
					mode: 'folder',
				},
				{
					type: 'shared',
					pattern: 'src/shared/**',
					mode: 'folder',
				},
			],
			// Dependency rules between layers
			'boundaries/rules': [
				{
					from: 'domain',
					disallow: ['ui'],
					message: 'domain layer must not import from ui layer.',
				},
				{
					from: 'utils',
					disallow: ['ui', 'domain'],
					message: 'utils layer must not import from ui or domain.',
				},
				{
					from: 'types',
					disallow: ['ui', 'domain', 'utils'],
					message: 'types layer must not import from other layers.',
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
