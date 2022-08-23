import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';
import { ShelfAliasController } from './shelf-alias.controller';
import { User } from 'src/users/user.entity';

@Module({
	imports: [WorkflowRunsModule, TypeOrmModule.forFeature([User, WorkflowDefinition, KubernetesWorkflowDefinition])],
	controllers: [ShelfAliasController, WorkflowsController],
})
export class WorkflowsModule {}
