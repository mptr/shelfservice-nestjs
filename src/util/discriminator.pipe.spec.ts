import { DiscriminatorPipe } from './discriminator.pipe';

abstract class Animal {
	readonly kind: string;
}
class Fish extends Animal {
	override readonly kind = 'fish';
}
class Bird extends Animal {
	override readonly kind = 'bird';
}

describe('DiscriminatorPipe', () => {
	const pipe = new DiscriminatorPipe({
		discriminator: 'kind',
		map: {
			fish: Fish,
			bird: Bird,
		},
	});
	it('should be defined', () => {
		expect(pipe).toBeDefined();
	});
	it('should transform', () => {
		expect(pipe.transform({ kind: 'fish' })).toBeInstanceOf(Fish);
		expect(pipe.transform({ kind: 'bird' })).toBeInstanceOf(Bird);
		const invalid = { kind: 'animal' };
		expect(pipe.transform(invalid)).toEqual(invalid);
	});
});
