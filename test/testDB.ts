import { DynamicModule, Injectable } from '@nestjs/common';
import { TypeOrmDataSourceFactory, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { PgOrmModuleOptions, TypeormConfigService } from 'src/config/typeorm-config/typeorm-config.service';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { setupTestDb } from './setupTestDb';

const testDbConfig: PgOrmModuleOptions = {
	type: 'postgres',
	name: 'default',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'secret',
	migrations: [],
	migrationsRun: true,
	logging: false,
	synchronize: true,
	dropSchema: true,
	retryAttempts: 0,
};

const testDbWorkerConfig = (): PgOrmModuleOptions => ({
	...testDbConfig,
	database: 'test' + process.env.JEST_WORKER_ID,
});

const testDataSourceFactory: TypeOrmDataSourceFactory = async (options: PostgresConnectionOptions) =>
	new DataSource(await setupTestDb(options));

// used in unit tests
export class TestDbModule {
	static connections: DataSource[] = [];

	public static closeAllConnections() {
		return Promise.all(TestDbModule.connections.map(c => c.destroy()));
	}

	static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
		const entsModule = TypeOrmModule.forFeature(entities);
		return {
			module: TestDbModule,
			imports: [
				TypeOrmModule.forRootAsync({
					useFactory: () => ({ ...testDbWorkerConfig(), entities }),
					dataSourceFactory: async (...args) => {
						const ds = await testDataSourceFactory(...args);
						TestDbModule.connections.push(ds);
						return ds;
					},
				}),
				entsModule,
			],
			exports: [entsModule],
		};
	}
}

// used in e2e tests
@Injectable()
export class TestDbConfigService extends TypeormConfigService {
	override async createTypeOrmOptions(): Promise<PgOrmModuleOptions> {
		return setupTestDb({ ...(await super.createTypeOrmOptions()), ...testDbWorkerConfig() });
	}
}
