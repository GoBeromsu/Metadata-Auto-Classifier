const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/__tests__'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
		'^api/(.*)$': '<rootDir>/src/api/$1',
		'^utils/(.*)$': '<rootDir>/src/utils/$1',
	},
	testMatch: ['**/*.test.ts'],
};

module.exports = config;
