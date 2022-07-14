import { Column, ColumnOptions } from 'typeorm';

type CtorType<T> = new (...args: any[]) => T;

export const JsonColumn = <T>(options: Omit<ColumnOptions, 'type' | 'transformer'> & { type: CtorType<T> }) =>
	Column({
		...options,
		type: 'json',
		array: false,
		transformer: {
			to: v => JSON.stringify(v),
			from: v => {
				if (options.array) return v.map(x => mapper(x, options.type));
				return mapper(v, options.type);
			},
		},
	});

const mapper = <T>(v: Partial<T>, t: CtorType<T>) => {
	const instance = new t();
	Object.assign(instance, v);
	return instance;
};
