import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';
import { ShelfAliasController } from './shelf-alias.controller';

@Module({
	imports: [WorkflowRunsModule, TypeOrmModule.forFeature([WorkflowDefinition, KubernetesWorkflowDefinition])],
	controllers: [ShelfAliasController, WorkflowsController],
})
export class WorkflowsModule {}
