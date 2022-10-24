import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { installMockAuth } from './auth-mock.helper';
import * as supertest from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TypeormConfigService } from 'src/config/typeorm-config/typeorm-config.service';
import { TestDbConfigService } from './testDB';
import { Server } from 'https';
import EventSource = require('eventsource');
import { Observable } from 'rxjs';

type TestModuleExtender = (app: TestingModuleBuilder) => TestingModuleBuilder;

export const e2eAppFactory = (extend: TestModuleExtender = b => b) =>
	Promise.resolve(
		// base module
		Test.createTestingModule({
			imports: [AppModule],
		}),
	) // apply mock auth
		.then(m => installMockAuth(m))
		// apply mock db
		.then(m => installMockDb(m))
		// apply extensions
		.then(m => extend(m))
		// build module
		.then(m => m.compile())
		// create app
		.then(m => m.createNestApplication())
		// initialize app
		.then(a => a.init())
		// add supertest
		.then(a => installRequest(a));

const installRequest = (app: INestApplication) => {
	return Object.assign(app, {
		request: () => supertest(app.getHttpServer()),
	});
};

const installMockDb = (app: TestingModuleBuilder) =>
	app.overrideProvider(TypeormConfigService).useClass(TestDbConfigService);

export const sse = (app: INestApplication, url: string, headers: Record<string, string>) =>
	new Observable(sub => {
		// since eventSource (SSE) is not supported by supertest, we have to use a real HTTP server
		const srv: Server = app.getHttpServer();
		srv.listen(3030 + Number(process.env.JEST_WORKER_ID || 0));
		const addr = srv.address();
		const addrString = typeof addr === 'string' ? addr : `http://localhost:${addr.port}`;

		const src = new EventSource(addrString + url, { headers });

		src.onmessage = e => sub.next(e);
		src.onerror = e => sub.error(e);
		return () => {
			src.close();
			srv.close();
		};
	});
