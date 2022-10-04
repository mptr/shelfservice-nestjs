/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	modulePaths: ['<rootDir>'],
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	// collectCoverage: true,
	// coverageReporters: ['lcov', 'html'],
	coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
	bail: true,
};
