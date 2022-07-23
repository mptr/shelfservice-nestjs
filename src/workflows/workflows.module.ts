import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';

@Module({
	imports: [WorkflowRunsModule, TypeOrmModule.forFeature([WorkflowDefinition, KubernetesWorkflowDefinition])],
	controllers: [WorkflowsController],
})
export class WorkflowsModule {}
