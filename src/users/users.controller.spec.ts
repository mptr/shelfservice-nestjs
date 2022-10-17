import { Test, TestingModule } from '@nestjs/testing';
import { TestDbModule } from 'test/testDB';
import { v4 } from 'uuid';
import { JWToken } from 'src/util/requester.decorator';
import { User } from './user.entity';
import { UsersController } from './users.controller';

describe('UsersController', () => {
	let controller: UsersController;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			imports: [TestDbModule.forFeature([User])],
		}).compile();

		controller = module.get<UsersController>(UsersController);
	});
	afterAll(() => TestDbModule.closeAllConnections());

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should return a list of all known users', async () => {
		await expect(controller.findAll()).resolves.toEqual([]);
	});

	const tok = Object.assign(new JWToken(), {
		preferred_username: 'mmuster',
		given_name: 'Max',
		family_name: 'Mustermann',
		email: 'mmuster@test.de',
	});

	it('should not create profile for other username', async () => {
		await expect(controller.save(tok, 'otheruser')).rejects.toThrow();
		await expect(controller.findAll()).resolves.toHaveLength(0);
	});

	it('should create a user', async () => {
		await expect(controller.save(tok, tok.preferred_username)).resolves.toBe(true);
		await expect(controller.findAll()).resolves.toHaveLength(1);
	});

	it('should not create a user twice', async () => {
		await expect(controller.save(tok, tok.preferred_username)).resolves.toBeTruthy();
		await expect(controller.findAll()).resolves.toHaveLength(1);
	});

	it('should update a user', async () => {
		tok.family_name = 'Sample';
		await expect(controller.save(tok, tok.preferred_username)).resolves.toBe(true);
		const users = await controller.findAll();
		expect(users).toHaveLength(1);
		expect(users[0].family_name).toEqual('Sample');
	});

	it('should find a user by id', async () => {
		const us = await controller.findAll();
		expect(us.length).toBeGreaterThan(0);
		await expect(controller.findOne(us[0].id)).resolves.toMatchObject(us[0]);
	});

	it('should delete a user', async () => {
		const us = await controller.findAll();
		expect(us.length).toBeGreaterThan(0);
		await expect(controller.remove(us[0].id)).resolves.toBe(true);
		await expect(controller.findAll()).resolves.toHaveLength(us.length - 1);
	});

	it('should redirect self to findOne', () => {
		const spy = jest.spyOn(controller, 'findOne');
		const id = v4();
		controller.findSelf({ id } as unknown as User);
		expect(spy).toHaveBeenCalledWith(id);
	});
});
