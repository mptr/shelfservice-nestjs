import { plainToInstance } from 'class-transformer';
import { Trim } from './trim.decorator';

class Foo {
	@Trim()
	bar: string;
}

describe('Trim', () => {
	test.each([
		{ bar: '  Hello  ', exp: 'Hello' },
		{ bar: 'Hello', exp: 'Hello' },
		{ bar: '  ', exp: '' },
	])('$bar', async ({ bar, exp }) => {
		const test = plainToInstance(Foo, { bar });
		expect(test.bar).toBe(exp);
	});
});
