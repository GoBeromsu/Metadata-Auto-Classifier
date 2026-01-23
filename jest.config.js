/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	testEnvironment: 'node',
	roots: ['<rootDir>/__tests__', '<rootDir>/src'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.test.json',
			},
		],
	},
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
		'^main$': '<rootDir>/src/main.ts',
		'^types$': '<rootDir>/src/types.ts',
		'^provider$': '<rootDir>/src/provider/index.ts',
		'^provider/(.*)$': '<rootDir>/src/provider/$1',
		'^lib$': '<rootDir>/src/lib/index.ts',
		'^lib/(.*)$': '<rootDir>/src/lib/$1',
		'^settings$': '<rootDir>/src/settings/index.ts',
		'^settings/(.*)$': '<rootDir>/src/settings/$1',
		'^classifier$': '<rootDir>/src/classifier/index.ts',
		'^classifier/(.*)$': '<rootDir>/src/classifier/$1',
	},
	testMatch: ['**/__tests__/**/*.test.ts'],
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
