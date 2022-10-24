import { ConsoleLogger, INestMicroservice } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { filter, firstValueFrom, ReplaySubject } from 'rxjs';
import { WorkflowScheduleModule } from 'src/workflow-schedule/workflow-schedule.module';
import { WorkflowScheduleService } from 'src/workflow-schedule/workflow-schedule.service';

class LoggerMonitor extends ConsoleLogger {
	recieved = new ReplaySubject<{ context: string; message: any }>();
	override log(message: any, context: any) {
		this.recieved.next({ message, context });
	}
}

jest.setTimeout(15 * 1000);

describe('Schedule (e2e)', () => {
	let app: INestMicroservice;
	const logger = new LoggerMonitor();

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [WorkflowScheduleModule],
		}).compile();

		app = moduleFixture.createNestMicroservice({
			logger,
		});
		await app.listen();
	});

	afterAll(() => app.close());

	it('should bootstrap the scheduler', async () => {
		await expect(
			// watch the first log message
			firstValueFrom(
				logger.recieved.pipe(
					// for the right context
					filter(x => x.context === WorkflowScheduleService.name),
				),
			).then(x => x.message),
		).resolves.toContain('collecting logs');
	});
});
