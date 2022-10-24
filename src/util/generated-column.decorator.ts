import { Column, ColumnOptions } from 'typeorm';

export const GeneratedColumn = (options: Omit<ColumnOptions, 'generatedType' | 'update' | 'insert'>) => {
	return Column({
		...options,
		generatedType: 'STORED',
		asExpression: options.asExpression,
		update: false,
		insert: false,
	});
};
