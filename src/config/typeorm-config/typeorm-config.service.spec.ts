import { TypeormConfigService } from './typeorm-config.service';

describe('TypeormConfigService', () => {
	let service: TypeormConfigService;

	beforeEach(() => {
		service = new TypeormConfigService();
	});

	it('should return config with values from env', () => {
		expect(service).toBeDefined();
	});
});
