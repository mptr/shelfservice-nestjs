import { Test, TestingModule } from '@nestjs/testing';
import { K8sJobService } from 'src/kubernetes/k8s-job.service';
import { WorkflowCollectService } from 'src/workflow-collect/workflow-collect.service';
import { WorkflowScheduleService } from './workflow-schedule.service';

describe('WorkflowScheduleService', () => {
	let service: WorkflowScheduleService;
	const testRuns = [{ status: { active: 0 } }, { status: { active: 1 } }];
	const k8sServiceMock = {
		getAllJobs: () => testRuns,
	};
	const colectServiceMock = {
		processInactive: jest.fn(),
		processActive: jest.fn(),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				WorkflowScheduleService,
				{ provide: K8sJobService, useValue: k8sServiceMock },
				{ provide: WorkflowCollectService, useValue: colectServiceMock },
			],
		})
			.setLogger(null)
			.compile();

		service = module.get<WorkflowScheduleService>(WorkflowScheduleService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should trigger job-processing depending on their state', async () => {
		await expect(service.collectLogs()).resolves.toBeUndefined();
		expect(colectServiceMock.processInactive).toHaveBeenNthCalledWith(1, testRuns[0]);
		expect(colectServiceMock.processActive).toHaveBeenNthCalledWith(1, testRuns[1]);
	});
});
