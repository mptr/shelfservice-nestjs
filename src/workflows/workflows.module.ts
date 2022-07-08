import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowRunsModule } from './workflow-runs/workflow-runs.module';

@Module({
	controllers: [WorkflowsController],
	providers: [WorkflowsService],
	imports: [WorkflowRunsModule],
})
export class WorkflowsModule {}
