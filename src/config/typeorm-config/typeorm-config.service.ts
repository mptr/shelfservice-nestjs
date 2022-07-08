import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeormConfigService implements TypeOrmOptionsFactory {
	createTypeOrmOptions(): TypeOrmModuleOptions {
		const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
		return {
			applicationName: 'ShelfService API',
			type: 'postgres',
			autoLoadEntities: true,
			host: DB_HOST,
			port: Number(DB_PORT),
			username: DB_USER,
			password: DB_PASSWORD,
			database: DB_NAME,
			synchronize: true,
		};
	}
}
