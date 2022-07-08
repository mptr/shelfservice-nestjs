import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });

	app.use(json({ limit: '5mb' }));
	app.use(urlencoded({ extended: true, limit: '5mb' }));

	const config = app.get(ConfigService);
	const realmUrl = config.get('KC_AUTH_SERVER_URL') + '/realms/' + config.get('KC_REALM');
	const oauth2Scheme: SecuritySchemeObject = {
		type: 'oauth2',
		openIdConnectUrl: realmUrl + '/.well-known/openid-configuration',
		flows: {
			implicit: {
				scopes: { email: true },
				authorizationUrl: realmUrl + '/protocol/openid-connect/auth',
			},
		},
	};

	const docBuilder = new DocumentBuilder()
		.setTitle('ShelfService API')
		.setVersion('1.0')
		.addOAuth2(oauth2Scheme, 'kc-token')
		.build();

	const document = SwaggerModule.createDocument(app, docBuilder);
	SwaggerModule.setup('api', app, document, {
		swaggerOptions: {
			oauth: { clientId: 'shelfservice-swagger' },
			persistAuthorization: true,
		},
	});

	await app.listen(3000);
}
bootstrap();
