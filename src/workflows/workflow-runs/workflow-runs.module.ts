import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';
import { User } from 'src/users/user.entity';
import { K8sJobService } from '../k8s-job.service';
import { KubernetesWorkflowRun, WorkflowRun } from './workflow-run.entity';
import { WorkflowRunsController } from './workflow-runs.controller';

@Module({
	imports: [TypeOrmModule.forFeature([User, WorkflowRun, KubernetesWorkflowRun])],
	controllers: [WorkflowRunsController],
	providers: [K8sJobService, K8sConfigService],
	exports: [K8sJobService],
})
export class WorkflowRunsModule {}
