import type { Config } from 'jest';
import defaults from '../jest.config';

const config: Config = {
	...defaults,
	rootDir: '..',
	testRegex: '.e2e-spec.ts$',
	coverageDirectory: '../coverage-e2e',
};

export default config;
