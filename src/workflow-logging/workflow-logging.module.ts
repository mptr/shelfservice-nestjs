import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';
import { WorkflowRun, WorkflowRunLog } from 'src/workflow-runs/workflow-run.entity';
import { WorkflowLogService } from './workflow-log.service';

@Module({
	imports: [KubernetesModule, ScheduleModule.forRoot(), TypeOrmModule.forFeature([WorkflowRun, WorkflowRunLog])],
	providers: [WorkflowLogService],
})
export class WorkflowLoggingModule {}
