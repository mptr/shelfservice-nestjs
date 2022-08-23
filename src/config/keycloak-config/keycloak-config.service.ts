import { Injectable } from '@nestjs/common';
import {
	KeycloakConnectConfig,
	KeycloakConnectOptionsFactory,
	PolicyEnforcementMode,
	TokenValidation,
} from 'nest-keycloak-connect';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
	// compose the keycloak configuration from the environment variables and fixed values
	createKeycloakConnectOptions(): KeycloakConnectConfig {
		const { KC_REALM, KC_AUTH_SERVER_URL, KC_CLIENT_ID } = process.env;
		return {
			realm: KC_REALM,
			authServerUrl: KC_AUTH_SERVER_URL,
			clientId: KC_CLIENT_ID,
			secret: undefined as any,
			'bearer-only': true,
			useNestLogger: false,
			'ssl-required': 'all',
			policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
			tokenValidation: TokenValidation.OFFLINE,
		};
	}
}
