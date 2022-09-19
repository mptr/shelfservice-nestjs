import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard, KeycloakConnectModule } from 'nest-keycloak-connect';
import { ConfigModule } from './config/config.module';
import { KeycloakConfigService } from './config/keycloak-config/keycloak-config.service';
import { TypeormConfigService } from './config/typeorm-config/typeorm-config.service';
import { UsersModule } from './users/users.module';
import { WorkflowLoggingModule } from './workflow-logging/workflow-logging.module';
import { WorkflowsModule } from './workflows/workflows.module';

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
