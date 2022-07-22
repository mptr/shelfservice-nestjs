import { zip } from './zip';

describe('zip', () => {
	it('should zip two arrays', () => {
		const as = [1, 2, 3];
		const bs = [4, 5, 6];
		const zipped = zip(as, bs, (a, b) => [a, b]);
		expect(zipped).toEqual([
			[1, 4],
			[2, 5],
			[3, 6],
		]);
	});

	it('should zip two arrays of different lengths', () => {
		const as = [1, 2, 3];
		const bs = [4, 5];
		const zipped = zip(as, bs, (a, b) => [a, b]);
		expect(zipped).toEqual([
			[1, 4],
			[2, 5],
		]);
	});
});
