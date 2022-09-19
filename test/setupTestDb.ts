import { DataSource, DataSourceOptions, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

// set timeout to 10 minutes for all tests using the docker db connection
if (process.env && process.env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID) jest.setTimeout(10 * 60 * 1000);

/**
 * Uses the default postgres database to (re)create a test db. The database name is derived from JEST_WORKER_ID.
 * @param options `ConnectionOptions` without database name
 * @returns `ConnectionOptions` with database name set to the newly created database
 */
export const setupTestDb = async (options: PostgresConnectionOptions): Promise<DataSourceOptions> => {
	await performManageAction(options, options.database, async r => {
		// alwasy drop the database first
		await r.query(`DROP DATABASE IF EXISTS "${options.database}" WITH (FORCE);`);
		// create blank db if no template should be used
		return r.query(`CREATE DATABASE "${options.database}";`);
	});

	// return the connect-options for the newly created database
	return options;
};

const performManageAction = async (
	options: Omit<PostgresConnectionOptions, 'type' | 'database'>,
	workerId: string,
	action: (runner: QueryRunner) => Promise<void>,
) => {
	const conn = new DataSource({
		...options,
		// dont setup the management db
		migrationsRun: false,
		migrations: [],
		synchronize: false,
		entities: [],
		// fixed type and connection name
		type: 'postgres',
		database: 'postgres',
		name: 'setup' + workerId,
	});
	await conn.initialize();

	const qrunner = conn.createQueryRunner();
	await qrunner.connect();

	await action(qrunner);

	await qrunner.release();
	await conn.destroy();
};
