import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowRunsService } from './workflow-runs.service';

describe('WorkflowRunsService', () => {
	let service: WorkflowRunsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [WorkflowRunsService],
		}).compile();

		service = module.get<WorkflowRunsService>(WorkflowRunsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
