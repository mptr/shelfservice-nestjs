import { validate } from 'class-validator';
import { IsRegEx } from './is-regex.decorator';

class Foo {
	@IsRegEx()
	regex: string;

	constructor(r: string) {
		this.regex = r;
	}
}

describe('IsRegex', () => {
	test.each([
		{ regex: '.*', exp: true },
		{ regex: '((', exp: false },
		{ regex: 'Hello', exp: true },
	])(`$regex`, async ({ regex, exp }) => {
		const test = new Foo(regex);
		await validate(test).then(errors => {
			expect(errors.length).toBe(exp ? 0 : 1);
		});
	});
});
