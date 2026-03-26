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

	// MAC tech-debt overrides: rules that require large-scale refactoring.
	// These are real issues but were not enforced before ESLint 9 adoption.
	// TODO: address these incrementally.
	{
		rules: {
			// MAC uses `any` types throughout legacy code from API responses.
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			// Promise handling in legacy event handlers.
			'@typescript-eslint/no-misused-promises': 'off',
			// UI text capitalization and inline style issues — cosmetic, low priority.
			'obsidianmd/ui/sentence-case': 'off',
			'obsidianmd/no-static-styles-assignment': 'off',
			'obsidianmd/settings-tab/no-manual-html-headings': 'off',
			// Template expression and base-to-string safety.
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-base-to-string': 'off',
			// MAC's auth and request modules legitimately use Node.js built-ins.
			'import/no-nodejs-modules': 'off',
			// no-undef is redundant in TypeScript — tsc catches undefined identifiers.
			'no-undef': 'off',
			// Legacy use of confirm() in settings modals.
			'no-alert': 'off',
		},
	},

	// Extended ignores (beyond baseConfig)
	{
		ignores: [
			'coverage/**',
			'__tests__/**',
			'__mocks__/**',
		],
	},

	// Prettier integration (must be last)
	prettier,
];
