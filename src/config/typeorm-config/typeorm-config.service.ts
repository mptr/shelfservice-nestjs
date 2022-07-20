import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

@Injectable()
export class TypeormConfigService implements TypeOrmOptionsFactory {
	createTypeOrmOptions(): TypeOrmModuleOptions {
		return {
			...TypeormConfigService.dataSourceOptions(),
			// replace entities with the entities of the modules
			entities: undefined,
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
			entities: [__dirname + '/**/*.entity{.ts,.js}'],
			username: DB_USER,
			password: DB_PASSWORD,
			database: DB_NAME,
			synchronize: true,
			dropSchema: false,
		};
	}
}

export const AppDataSource = new DataSource(TypeormConfigService.dataSourceOptions());
