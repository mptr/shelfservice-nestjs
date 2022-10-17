import type { Config } from 'jest';

const config: Config = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	modulePaths: ['<rootDir>'],
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	testEnvironment: 'node',
	collectCoverageFrom: ['src/**/*.(t|j)s'],
	coverageDirectory: './coverage',
	collectCoverage: true,
	coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
	bail: true,
};
export default config;
