import { TypeormConfigService } from './typeorm-config.service';

describe('TypeormConfigService', () => {
	let service: TypeormConfigService;

	beforeEach(() => {
		service = new TypeormConfigService();
	});

	it('should return config with values from env', () => {
		expect(service).toBeDefined();
	});

	it('should build config from env', () => {
		const config = {
			DB_HOST: 'dbhost.domain.com',
			DB_PORT: '1337',
			DB_USER: 'postgresuser01',
			DB_PASSWORD: 'secret',
			DB_NAME: 'postgresdb01',
		};
		process.env = config;
		expect(TypeormConfigService.dataSourceOptions()).toMatchObject({
			type: 'postgres',
			host: config.DB_HOST,
			port: +config.DB_PORT,
			entities: [__dirname + '/**/*.entity{.ts,.js}'],
			username: config.DB_USER,
			password: config.DB_PASSWORD,
			database: config.DB_NAME,
			synchronize: true,
			dropSchema: false,
		});
	});

	it('should build module config', () => {
		expect(new TypeormConfigService().createTypeOrmOptions()).toMatchObject({
			entities: undefined,
			autoLoadEntities: true,
		});
	});
});
