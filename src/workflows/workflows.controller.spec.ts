import { Test, TestingModule } from '@nestjs/testing';
import { TestDbModule } from 'test/testDB';
import { v4 } from 'uuid';
import { User } from 'src/users/user.entity';
import { Redirection } from 'src/util/redirect.filter';
import { KubernetesWorkflowDefinition, WebWorkerWorkflowDefinition } from './workflow-definition.entity';
import { WorkflowsController } from './workflows.controller';

describe('WorkflowsController', () => {
	let controller: WorkflowsController;

	const mockUser = new User({
		email: 'test@user.com',
		family_name: 'Mustermann',
		given_name: 'Max',
		preferred_username: 'mmuster',
	});

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WorkflowsController],
			imports: [TestDbModule.forFeature([User])],
		}).compile();

		controller = module.get<WorkflowsController>(WorkflowsController);
		await mockUser.save();
	});
	afterAll(() => TestDbModule.closeAllConnections());

	const mockK8sWfData = {
		name: 'test',
		description: 'test description',
		command: [],
		image: 'testimage:v1',
		parameterFields: [],
	};

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should return an empty array of workflows', async () => {
		await expect(controller.findAll()).resolves.toEqual([]);
	});

	it('should not store an incomplete workflow ', async () => {
		await expect(controller.create(mockUser, new KubernetesWorkflowDefinition())).rejects.toBeDefined();
	});

	it('should store a workflow', async () => {
		const mockK8sWf = new KubernetesWorkflowDefinition();
		Object.assign(mockK8sWf, mockK8sWfData);
		await expect(controller.create(mockUser, mockK8sWf)).rejects.toBeInstanceOf(Redirection);
	});

	it('should store the workflow correctly', async () => {
		await expect(controller.findAll()).resolves.toHaveLength(1);
		const wf = (await controller.findAll())[0];
		expect(wf.name).toEqual(mockK8sWfData.name);
		expect(wf.description).toEqual(mockK8sWfData.description);
		expect(wf.createdAt.getTime() - Date.now()).toBeLessThan(1000);
		expect(wf.id).toBeTruthy();
		expect(wf.kind).toEqual('kubernetes');
	});

	it('should not store a workflow with the same name', async () => {
		const mock2 = new KubernetesWorkflowDefinition();
		Object.assign(mock2, mockK8sWfData);
		await expect(controller.create(mockUser, mock2)).rejects.toBeDefined();
	});

	it('should store a web worker workflow', async () => {
		const mockWwWf = new WebWorkerWorkflowDefinition();
		Object.assign(mockWwWf, { ...mockK8sWfData, name: 'test2', script: 'console.log(1);' });
		await expect(controller.create(mockUser, mockWwWf)).rejects.toBeInstanceOf(Redirection);
		await expect(controller.findAll()).resolves.toHaveLength(2);
	});

	it('should allow searching for workflows', async () => {
		// by name/desc
		await expect(controller.findAll('test')).resolves.toHaveLength(2);
		await expect(controller.findAll('test2')).resolves.toHaveLength(1);
		await expect(controller.findAll('test3')).resolves.toHaveLength(0);
		// by owner
		await expect(controller.findAll('Max')).resolves.toHaveLength(2);
		await expect(controller.findAll('Mia')).resolves.toHaveLength(0);
		await expect(controller.findAll('Mia')).resolves.toHaveLength(0);
		// by id
		const wf = (await controller.findAll())[0];
		await expect(controller.findAll(wf.id)).resolves.toHaveLength(1);
	});

	it('should find workflow by id', async () => {
		const wf = (await controller.findAll())[0];
		await expect(controller.findOne(wf.id)).resolves.toMatchObject(wf);
	});

	it('should throw on unknown id', async () => {
		await expect(controller.findOne(v4())).rejects.toThrow();
	});

	it('should delete a workflow', async () => {
		const wf = (await controller.findAll())[0];
		await expect(controller.remove(mockUser, wf.id)).resolves.toBeDefined();
		await expect(controller.findAll()).resolves.toHaveLength(1);
	});
});
