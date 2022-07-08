import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowRunsController } from './workflow-runs.controller';
import { WorkflowRunsService } from './workflow-runs.service';

describe('WorkflowRunsController', () => {
	let controller: WorkflowRunsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WorkflowRunsController],
			providers: [WorkflowRunsService],
		}).compile();

		controller = module.get<WorkflowRunsController>(WorkflowRunsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
