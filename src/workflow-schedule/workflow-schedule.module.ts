import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/config/config.module';
import { TypeormConfigService } from 'src/config/typeorm-config/typeorm-config.service';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';
import { User } from 'src/users/user.entity';
import { WorkflowCollectModule } from 'src/workflow-collect/workflow-collect.module';
import { WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { WorkflowScheduleService } from './workflow-schedule.service';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forRootAsync({
			useExisting: TypeormConfigService,
			imports: [ConfigModule],
		}),
		TypeOrmModule.forFeature([User, WorkflowDefinition]),
		KubernetesModule,
		WorkflowCollectModule,
		ScheduleModule.forRoot(),
	],
	providers: [WorkflowScheduleService],
})
export class WorkflowScheduleModule {}
