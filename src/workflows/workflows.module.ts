import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module';
import { User } from 'src/users/user.entity';
import { ShelfAliasController } from './shelf-alias.controller';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from './workflow-definition.entity';
import { WorkflowsController } from './workflows.controller';

@Module({
	imports: [
		WorkflowRunsModule,
		TypeOrmModule.forFeature([User, WorkflowDefinition, KubernetesWorkflowDefinition, WebWorkerWorkflowDefinition]),
	],
	controllers: [ShelfAliasController, WorkflowsController],
})
export class WorkflowsModule {}
