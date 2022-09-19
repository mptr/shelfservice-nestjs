import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { TestDbModule } from 'test/testDB';
import { K8sJobService } from 'src/kubernetes/k8s-job.service';
import { User } from 'src/users/user.entity';
import { KubernetesWorkflowDefinition, WebWorkerWorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { KubernetesWorkflowRun, WebWorkerWorkflowRun } from './workflow-run.entity';
import { WorkflowRunsController } from './workflow-runs.controller';

describe('WorkflowRunsController', () => {
	let controller: WorkflowRunsController;

	const mockCreateUser = new User({
		email: 'mmuster@user.com',
		family_name: 'Mustermann',
		given_name: 'Max',
		preferred_username: 'mmuster',
	});
	const mockRunUser = new User({
		email: 'ssample@user.com',
		family_name: 'Sample',
		given_name: 'Susan',
		preferred_username: 'ssample',
	});

	const mockK8sWfDef = new KubernetesWorkflowDefinition();
	mockK8sWfDef.name = 'test k8s';
	mockK8sWfDef.description = 'test k8s description';
	mockK8sWfDef.image = 'test-image';
	mockK8sWfDef.parameterFields = [];
	mockK8sWfDef.owners = [mockCreateUser];

	const mockWwWfDef = new WebWorkerWorkflowDefinition();
	mockWwWfDef.name = 'test ww';
	mockWwWfDef.description = 'test ww description';
	mockWwWfDef.parameterFields = [];
	mockWwWfDef.owners = [mockCreateUser];
	mockWwWfDef.script = 'console.log("ok");';

	const k8sServiceMock = {
		apply: jest.fn(),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WorkflowRunsController],
			providers: [{ provide: K8sJobService, useValue: k8sServiceMock }],
			imports: [TestDbModule.forFeature([User])],
		}).compile();

		controller = module.get<WorkflowRunsController>(WorkflowRunsController);
		await mockCreateUser.save();
		await mockRunUser.save();
		await mockK8sWfDef.save();
		await mockWwWfDef.save();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('start Workflows', () => {
		it('should start a kubernetes workflow', async () => {
			await expect(controller.create(mockRunUser, mockK8sWfDef.id, {})).resolves.toBeDefined();
			const param: KubernetesWorkflowRun = k8sServiceMock.apply.mock.calls[0][0];
			delete mockK8sWfDef.owners;
			expect(param.workflowDefinition).toMatchObject(mockK8sWfDef);
			expect(param.ranBy).toEqual(mockRunUser);
			expect(param.parameters).toEqual([]);
			await expect(KubernetesWorkflowRun.findOneByOrFail({})).resolves.toMatchObject({ status: 'running' });
		});

		it('should start a webworker workflow', async () => {
			await expect(controller.create(mockCreateUser, mockWwWfDef.id, {})).resolves.toBeDefined();
			const run = await WebWorkerWorkflowRun.findOneByOrFail({});
			expect(run.status).toBe('prepared');
		});
	});

	describe('show WorkflowRun status and details', () => {
		it('should show a run by id', async () => {
			const run = await KubernetesWorkflowRun.findOneByOrFail({});
			await expect(controller.findOne(mockRunUser, mockK8sWfDef.id, run.id)).resolves.toMatchObject({ id: run.id });
		});
	});

	describe('WebWorker status flow', () => {
		it('should not return a script for k8s workflows', async () => {
			const run = await KubernetesWorkflowRun.findOneByOrFail({});
			const res = {
				send: jest.fn(),
			} as unknown as Response;
			await expect(controller.getWorker(res, mockCreateUser, mockK8sWfDef.id, run.id)).rejects.toThrow();
			expect(res.send).not.toHaveBeenCalled();
		});

		it('should not return a script for non start user', async () => {
			const run = await KubernetesWorkflowRun.findOneByOrFail({});
			const res = {
				send: jest.fn(),
			} as unknown as Response;
			await expect(controller.getWorker(res, mockCreateUser, mockK8sWfDef.id, run.id)).rejects.toThrow();
			expect(res.send).not.toHaveBeenCalled();
		});

		it('should return the worker script', async () => {
			const run = await WebWorkerWorkflowRun.findOneByOrFail({});
			const res = {
				send: jest.fn(),
			};
			await expect(
				controller.getWorker(res as unknown as Response, mockCreateUser, mockWwWfDef.id, run.id),
			).resolves.toBeFalsy();
			expect(res.send).toHaveBeenCalled();
			expect(res.send.mock.calls[0][0]).toBeInstanceOf(Buffer);

			const runUpdated = await WebWorkerWorkflowRun.findOneByOrFail({});
			expect(runUpdated.status).toBe('running');
		});

		it('should store logs of a completed workflow', async () => {
			const run = await WebWorkerWorkflowRun.findOneByOrFail({});
			const dto = {
				log: 'test log',
				result: true,
			};
			await expect(controller.reportLog(mockCreateUser, mockWwWfDef.id, run.id, dto)).rejects.toBeDefined();
			await expect(controller.reportLog(mockRunUser, mockWwWfDef.id, run.id, dto)).resolves.toEqual(dto);
		});
	});
});
