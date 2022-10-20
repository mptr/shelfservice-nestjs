import { Test } from '@nestjs/testing';
import { TestDbModule } from 'test/testDB';
import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { JsonColumn } from './json-column.decorator';

class Animal {
	readonly kind: string;
}
class Fish extends Animal {
	override readonly kind = 'fish';
}
class Cat extends Animal {
	override readonly kind = 'cat';
}

@Entity()
class Foo extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@JsonColumn({
		type: Animal,
		nullable: true,
		discriminator: {
			property: 'kind',
			subTypes: [
				{ name: 'fish', value: Fish },
				{ name: 'cat', value: Cat },
			],
		},
	})
	animal: Animal;
}

@Entity()
class Bar extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@JsonColumn({
		array: true,
		type: Animal,
		discriminator: {
			property: 'kind',
			subTypes: [
				{ name: 'fish', value: Fish },
				{ name: 'cat', value: Cat },
			],
		},
	})
	animals: Animal[];
}

@Entity()
class Baz extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@JsonColumn({ type: Animal })
	obj: Animal;
}

describe('JsonColumn', () => {
	beforeAll(async () => {
		await Test.createTestingModule({
			imports: [TestDbModule.forFeature([Foo, Bar, Baz])],
		}).compile();
	});
	afterAll(() => TestDbModule.closeAllConnections());

	it('should save entities', async () => {
		const foo = new Foo();
		foo.animal = new Fish();
		await foo.save();
	});

	it('should load entities', async () => {
		const foo = await Foo.findOneByOrFail({});
		expect(foo.animal).toBeInstanceOf(Fish);
	});

	it('should save entities with array', async () => {
		const bar = new Bar();
		bar.animals = [new Fish(), new Cat()];
		await bar.save();
	});

	it('should load entities with array', async () => {
		const bar = await Bar.findOneByOrFail({});
		expect(bar.animals).toHaveLength(2);
		expect(bar.animals[0]).toBeInstanceOf(Fish);
		expect(bar.animals[1]).toBeInstanceOf(Cat);
	});

	it('should allow null values', async () => {
		const foo = new Foo();
		foo.animal = null;
		await foo.save();
		const l = await Foo.findOneByOrFail({ id: foo.id });
		expect(l.animal).toBeNull();
	});

	it('should allow non-discriminated values', async () => {
		const baz = new Baz();
		baz.obj = new Fish();
		await baz.save();
		const l = await Baz.findOneByOrFail({ id: baz.id });
		expect(l.obj).toEqual({ kind: 'fish' });
		expect(l.obj).not.toBeInstanceOf(Fish);
		expect(l.obj).toBeInstanceOf(Animal);
	});
});
