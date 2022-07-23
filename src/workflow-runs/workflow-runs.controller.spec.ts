import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowRunsController } from './workflow-runs.controller';

describe('WorkflowRunsController', () => {
	let controller: WorkflowRunsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WorkflowRunsController],
		}).compile();

		controller = module.get<WorkflowRunsController>(WorkflowRunsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
