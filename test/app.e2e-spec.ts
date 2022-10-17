import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { WorkflowLogService } from 'src/workflow-logging/workflow-log.service';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(WorkflowLogService)
			.useValue({})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('/users (GET)', () => request(app.getHttpServer()).get('/users').expect(401));
});
