import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { KeycloakConfigService } from './config/keycloak-config/keycloak-config.service';
import { ConfigModule } from './config/config.module';
import { TypeormConfigService } from './config/typeorm-config/typeorm-config.service';
import { AuthGuard, KeycloakConnectModule } from 'nest-keycloak-connect';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { WorkflowLoggingModule } from './workflow-logging/workflow-logging.module';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useClass: TypeormConfigService,
		}),
		KeycloakConnectModule.registerAsync({
			imports: [ConfigModule],
			useExisting: KeycloakConfigService,
		}),
		UsersModule,
		WorkflowsModule,
		ConfigModule,
		WorkflowLoggingModule, // todo: move to separate app
	],
	providers: [
		{ provide: APP_GUARD, useExisting: AuthGuard },
		AuthGuard,
		{
			provide: APP_PIPE,
			useValue: new ValidationPipe({
				whitelist: true,
				enableDebugMessages: true,
				transform: true,
			}),
		},
		// { provide: APP_FILTER, useClass: TypeormNotFoundExceptionFilter },
		// { provide: APP_FILTER, useClass: TypeormQueryFailedExceptionFilter },
	],
})
export class AppModule {}
