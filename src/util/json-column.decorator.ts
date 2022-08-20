import { Column, ColumnOptions } from 'typeorm';

type CtorType<T> = new (...args: any[]) => T;

export type Discriminator<T, L extends string> = T extends { [label in L]: string }
	? {
			property: L;
			subTypes: { name: T[L]; value: CtorType<T> }[];
	  }
	: never;

export const JsonColumn = <T>(
	options: Omit<ColumnOptions, 'type' | 'transformer'> & {
		type: CtorType<T>;
		discriminator?: Discriminator<T, 'kind'>;
	},
) =>
	Column({
		...options,
		type: 'jsonb',
		array: false,
		transformer: {
			to: v => v,
			from: v => {
				const getType = (x: T) => {
					const d = options.discriminator;
					if (!d) return options.type;
					const label = x[d.property];
					return d.subTypes.filter(t => t.name === label)[0].value;
				};
				if (options.array) return v.map((x: T) => mapper(x, getType(x)));
				return mapper(v, getType(v));
			},
		},
	});

const mapper = <T>(v: Partial<T>, t: CtorType<T>) => {
	const instance = new t();
	Object.assign(instance, v);
	return instance;
};
