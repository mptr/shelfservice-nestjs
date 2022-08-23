import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';
import { WorkflowRunLog } from 'src/workflow-runs/workflow-run-log.entity';
import { WorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { WorkflowLogService } from './workflow-log.service';

@Module({
	imports: [
		forwardRef(() => KubernetesModule),
		ScheduleModule.forRoot(),
		TypeOrmModule.forFeature([WorkflowRun, WorkflowRunLog]),
	],
	providers: [WorkflowLogService],
	exports: [WorkflowLogService],
})
export class WorkflowLoggingModule {}
