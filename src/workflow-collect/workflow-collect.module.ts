import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';
import { WorkflowRunLog } from 'src/workflow-runs/workflow-run-log.entity';
import { WorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { WorkflowCollectService } from './workflow-collect.service';

@Module({
	imports: [forwardRef(() => KubernetesModule), TypeOrmModule.forFeature([WorkflowRun, WorkflowRunLog])],
	providers: [WorkflowCollectService],
	exports: [WorkflowCollectService],
})
export class WorkflowCollectModule {}
