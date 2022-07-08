import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { KeycloakConfigService } from './keycloak-config/keycloak-config.service';
import { TypeormConfigService } from './typeorm-config/typeorm-config.service';

const services = [KeycloakConfigService, TypeormConfigService];

@Module({
	imports: [
		NestConfigModule.forRoot({
			// apply this config to all modules
			isGlobal: true,
			// load environment variables from .env file
			envFilePath: '.env',
		}),
	],
	providers: services,
	exports: services,
})
export class ConfigModule {}
