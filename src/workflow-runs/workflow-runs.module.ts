import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';
import { User } from 'src/users/user.entity';
import { KubernetesWorkflowRun, WebWorkerWorkflowRun, WorkflowRun } from './workflow-run.entity';
import { WorkflowRunsController } from './workflow-runs.controller';

@Module({
	imports: [
		KubernetesModule,
		TypeOrmModule.forFeature([User, WorkflowRun, KubernetesWorkflowRun, WebWorkerWorkflowRun]),
	],
	controllers: [WorkflowRunsController],
})
export class WorkflowRunsModule {}
