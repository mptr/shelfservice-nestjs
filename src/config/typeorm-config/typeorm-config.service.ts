import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export type PgOrmModuleOptions = TypeOrmModuleOptions & PostgresConnectionOptions;

@Injectable()
export class TypeormConfigService implements TypeOrmOptionsFactory {
	async createTypeOrmOptions(): Promise<PgOrmModuleOptions> {
		return {
			...TypeormConfigService.dataSourceOptions(),
			// for in-app usage determine entities by module imports
			autoLoadEntities: true,
		};
	}

	static dataSourceOptions(): Partial<PostgresConnectionOptions> & { type: string } {
		const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
		return {
			applicationName: 'ShelfService API',
			type: 'postgres',
			host: DB_HOST,
			port: Number(DB_PORT),
			username: DB_USER,
			password: DB_PASSWORD,
			database: DB_NAME,
			synchronize: true,
			dropSchema: false,
		};
	}
}

export const AppDataSource = new DataSource({
	...TypeormConfigService.dataSourceOptions(),
	entities: [__dirname + '/**/*.entity{.ts,.js}'], // expose these for cli usage
});
