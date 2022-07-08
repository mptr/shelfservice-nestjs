import { Module } from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';
import { WorkflowRunsController } from './workflow-runs.controller';

@Module({
	controllers: [WorkflowRunsController],
	providers: [WorkflowRunsService],
})
export class WorkflowRunsModule {}
