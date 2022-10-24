import { NestFactory } from '@nestjs/core';
import { WorkflowScheduleModule } from './workflow-schedule/workflow-schedule.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice(WorkflowScheduleModule, {
		logger: ['error', 'warn', 'debug', 'log'],
	});
	await app.listen();
}
bootstrap();
