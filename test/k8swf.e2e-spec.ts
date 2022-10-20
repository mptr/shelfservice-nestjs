import { HttpStatus, INestApplication } from '@nestjs/common';
import { firstValueFrom, map, takeUntil, takeWhile, tap, toArray } from 'rxjs';
import * as supertest from 'supertest';
import { v4 } from 'uuid';
import { as } from './auth-mock.helper';
import { e2eAppFactory, sse } from './e2e.helper';

describe('AppController (e2e)', () => {
	let app: INestApplication & { request: () => supertest.SuperTest<supertest.Test> };

	beforeAll(async () => {
		app = await e2eAppFactory();
	});
	afterAll(() => app.close());

	it('should not sign up other users', () =>
		app.request().put('/users/ssample').set(as('Max Muster')).expect(HttpStatus.FORBIDDEN));

	it('should sign up the user', async () => {
		await app.request().put('/users/mmuster').set(as('Max Muster')).expect(HttpStatus.OK);
		await app.request().put('/users/ssample').set(as('Susan Sample')).expect(HttpStatus.OK);
	});

	it('should show no workflows', () =>
		app.request().get('/workflows').set(as('Max Muster')).expect(HttpStatus.OK).expect([]));

	it('should create a kubernetes workflow', () =>
		app
			.request()
			.post('/workflows')
			.set(as('Max Muster'))
			.send({
				kind: 'kubernetes',
				name: 'TestWorkflow',
				description: 'This is just for testing',
				parameterFields: [
					{
						kind: 'number',
						name: 'LUCKYNUMBER',
						displayName: 'Lucky Number',
						description: 'Your lucky number',
						required: true,
					},
				],
				image: 'busybox',
				command: ['/bin/sh', '-c', 'echo Hello $IDENTITY_FIRSTNAME. Your lucky number is $LUCKYNUMBER'],
			})
			.redirects(1)
			.expect(HttpStatus.OK));

	let id: unknown;
	it('should find the workflow', async () => {
		const body = await app
			.request()
			.get('/workflows')
			.set(as('Susan Sample'))
			.expect(HttpStatus.OK)
			.then(res => res.body);
		expect(body).toHaveLength(1);
		id = body[0].id;
		expect(id).toBeTruthy();
		await app.request().get(`/workflows/${id}`).set(as('Susan Sample')).expect(HttpStatus.OK);
	});

	it('should not find other workflows', () => {
		return app.request().get(`/workflows/${v4()}`).set(as('Susan Sample')).expect(HttpStatus.NOT_FOUND);
	});

	test.each([
		{},
		{ luckynumber: 4 },
		{ LUCKYNUMBER: false },
		{ LUCKYNUMBER: '0x7' },
		{ LUCKYNUMBER: 5 /* all have to be sent as string */ },
	])('should not start the workflow with invalid parameters: %p', p => {
		return app
			.request()
			.post(`/workflows/${id}/runs`)
			.set(as('Susan Sample'))
			.send(p)
			.redirects(1)
			.expect(HttpStatus.UNPROCESSABLE_ENTITY);
	});

	let runid: unknown;
	it('should start the workflow', async () => {
		const body = await app
			.request()
			.post(`/workflows/${id}/runs`)
			.set(as('Susan Sample'))
			.send({ LUCKYNUMBER: '42' })
			.redirects(1)
			.expect(HttpStatus.OK)
			.then(res => res.body);
		expect(body).toHaveProperty('id');
		runid = body.id;
		expect(body).toHaveProperty('status', 'running');
		expect(
			body.variables.some((x: { name: string; value: string }) => x.name === 'LUCKYNUMBER' && x.value === '42'),
		).toBe(true);
		expect(
			body.variables.some(
				(x: { name: string; value: string }) => x.name === 'IDENTITY_FIRSTNAME' && x.value === 'Susan',
			),
		).toBe(true);
		expect(body.ranBy.preferred_username).toBe('ssample');
	});

	it('should allow subscribing to the logs', async () => {
		const o = sse(app, `/workflows/${id}/runs/${runid}/log`, as('Susan Sample')).pipe(
			map((evt: MessageEvent) => JSON.parse(evt.data)),
			takeWhile(d => d.type !== 'complete', true),
			toArray(),
		);
		const msgs = await firstValueFrom(o);
		expect(msgs.length).toBeGreaterThan(0);
		expect(msgs[msgs.length - 1]).toMatchObject({ type: 'complete', message: '' });
		expect(msgs.some(m => m.message.includes('Hello Susan. Your lucky number is 42'))).toBe(true);
	});
});
