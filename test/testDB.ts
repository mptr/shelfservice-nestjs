import { DynamicModule } from '@nestjs/common';
import { TypeOrmDataSourceFactory, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { setupTestDb } from './setupTestDb';

const testDbConfig: TypeOrmModuleOptions & PostgresConnectionOptions = {
	type: 'postgres',
	name: 'default',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	entities: [__dirname + '/../src/**/*.entity.ts'],
	password: 'secret',
	migrations: [],
	migrationsRun: true,
	logging: false,
	synchronize: true,
	dropSchema: true,
	retryAttempts: 0,
};

const testDbWorkerConfig = () => ({
	...testDbConfig,
	database: 'test' + process.env.JEST_WORKER_ID,
});

const testDataSourceFactory: TypeOrmDataSourceFactory = async (options: PostgresConnectionOptions) =>
	new DataSource(await setupTestDb(options));

export class TestDbModule {
	static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
		const entsModule = TypeOrmModule.forFeature(entities);
		return {
			module: TestDbModule,
			imports: [
				TypeOrmModule.forRootAsync({
					useFactory: testDbWorkerConfig,
					dataSourceFactory: testDataSourceFactory,
				}),
				entsModule,
			],
			exports: [entsModule],
		};
	}
}

// @Injectable()
// export class TestDbConfigService implements TypeOrmOptionsFactory {
// 	async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
// 		return setupTestDb({
// 			...testDbConfig,
// 			database: 'test' + process.env.JEST_WORKER_ID,
// 		});
// 	}
// }
