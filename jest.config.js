/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/__tests__', '<rootDir>/src'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: 'tsconfig.json',
			isolatedModules: true,
		}],
	},
	transformIgnorePatterns: [],
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
		'^main$': '<rootDir>/src/main.ts',
		'^types$': '<rootDir>/src/types.ts',
		'^constants$': '<rootDir>/src/constants.ts',
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
