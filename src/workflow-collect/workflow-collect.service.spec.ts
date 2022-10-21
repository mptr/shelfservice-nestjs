import { V1Job } from '@kubernetes/client-node';
import { LoggerService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { K8sJobService } from 'src/kubernetes/k8s-job.service';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { v4 } from 'uuid';
import { WorkflowCollectService } from './workflow-collect.service';

describe('WorkflowCollectService', () => {
	let service: WorkflowCollectService;
	const k8sServiceMock = {
		getLogOnce: () => 'test',
		deleteJob: jest.fn(),
	};
	const logger = {
		log: jest.fn(),
		warn: jest.fn(),
		error: console.log,
	};
	let workflowRunEntity: KubernetesWorkflowRun;

	beforeEach(() => {
		jest.resetAllMocks();
		jest.spyOn(KubernetesWorkflowRun, 'findOne').mockImplementation(async () => workflowRunEntity);
	});

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				WorkflowCollectService,
				{
					provide: K8sJobService,
					useValue: k8sServiceMock,
				},
			],
		})
			.setLogger(logger as unknown as LoggerService)
			.compile();

		service = module.get<WorkflowCollectService>(WorkflowCollectService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	const job = {
		status: { active: 0, startTime: new Date(), failed: false },
		metadata: { annotations: { jobId: v4() }, name: 'testjob' },
	} as unknown as V1Job;

	it('should not process a false inactive job', async () => {
		job.status.active = 1;
		await expect(service.processInactive(job)).resolves.toBeUndefined();
		job.status.active = 0; // restore
	});

	it('should print a warining if the job is not found', async () => {
		await expect(service.processInactive(job)).resolves.toBeUndefined();
		expect(logger.warn).toHaveBeenCalled();
	});

	it('should skip processing if the job already has a result stored', async () => {
		workflowRunEntity = new KubernetesWorkflowRun();
		workflowRunEntity.result = false; // run was not successful
		await expect(service.processInactive(job)).resolves.toBeUndefined();
	});

	it('should archive the workflow ans remove the job from k8s', async () => {
		workflowRunEntity = new KubernetesWorkflowRun();
		workflowRunEntity.result = null; // run has not been archived yet
		const archive = jest.spyOn(workflowRunEntity, 'archive').mockImplementation(async () => undefined);
		await expect(service.processInactive(job)).resolves.toBeUndefined();
		expect(archive).toHaveBeenLastCalledWith(true, k8sServiceMock.getLogOnce());
		expect(k8sServiceMock.deleteJob).toHaveBeenLastCalledWith(job);
	});

	describe('job monitoring', () => {
		it('should log if the job has not yet passed the threshold', async () => {
			await expect(service.processActive(job)).resolves.toBeUndefined();
			expect(logger.log).toHaveBeenCalled();
		});

		it('should warn if the job has passed the threshold', async () => {
			job.status.startTime = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2); // 2 days ago
			await expect(service.processActive(job)).resolves.toBeUndefined();
			expect(logger.warn).toHaveBeenCalled();
		});
	});
});
