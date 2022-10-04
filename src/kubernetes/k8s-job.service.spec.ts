import * as k8s from '@kubernetes/client-node';
import { Test, TestingModule } from '@nestjs/testing';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';
import { WorkflowLogService } from 'src/workflow-logging/workflow-log.service';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { Parameter, SetParameter } from 'src/workflows/parameter.entity';
import { KubernetesWorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { v4 } from 'uuid';
import { K8sJobService } from './k8s-job.service';

describe('K8sJobService', () => {
	let service: K8sJobService;

	const configServiceMock = {
		namespace: 'test-ns',
		makeApiClient: jest.fn().mockImplementation(p => {
			if (p === k8s.BatchV1Api) return batchApiMock;
			if (p === k8s.CoreV1Api) return coreApiMock;
		}),
	};

	const batchApiMock = {
		listNamespacedJob: jest.fn(),
		createNamespacedJob: jest.fn(),
	};
	const coreApiMock = {
		listNamespacedPod: jest.fn(),
		readNamespacedPodLog: jest.fn(),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				K8sJobService,
				{ provide: K8sConfigService, useValue: configServiceMock },
				{ provide: WorkflowLogService, useValue: {} },
			],
		}).compile();

		service = module.get<K8sJobService>(K8sJobService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should return a list of jobs', async () => {
		const r = { body: { items: 'someitems' } };
		batchApiMock.listNamespacedJob.mockResolvedValue(r);
		await expect(service.getAllJobs()).resolves.toBe(r.body.items);
	});

	const run = new KubernetesWorkflowRun();
	run.workflowDefinition = {
		sanitizedName: 'sanitizedName',
		image: 'imgname',
		command: ['/bin/sh'],
	} as KubernetesWorkflowDefinition;
	// @ts-ignore
	run.id = v4();
	run.parameters = [
		new SetParameter(
			'x',
			new Parameter({
				name: 'variable1',
			}),
		),
	];

	it('should start a job', async () => {
		const r = { body: 'ok' };
		batchApiMock.createNamespacedJob.mockResolvedValue(r);
		await expect(service.apply(run)).resolves.toBe(r.body);
		const call = batchApiMock.createNamespacedJob.mock.lastCall;
		expect(call[0]).toBe(configServiceMock.namespace);
		expect(call[1]).toMatchObject({
			apiVersion: 'batch/v1',
			kind: 'Job',
			metadata: {
				name: run.jobTag,
				annotations: { jobName: run.workflowDefinition.sanitizedName, jobId: run.id },
			},
			spec: {
				template: {
					spec: {
						containers: [
							{
								image: run.workflowDefinition.image,
								name: run.jobTag,
								env: run.parameters,
								command: run.workflowDefinition.command,
							},
						],
						restartPolicy: 'Never',
					},
				},
				backoffLimit: 0,
			},
		});
	});

	it('should get the logs of a pod once', async () => {
		const r = { body: { items: [{ metadata: { name: 'test' } }] } };
		const logr = { body: 'log1' };
		coreApiMock.listNamespacedPod.mockResolvedValue(r);
		coreApiMock.readNamespacedPodLog.mockResolvedValue(logr);
		await expect(service.getLogOnce(run)).resolves.toBe('log1');
	});
});
