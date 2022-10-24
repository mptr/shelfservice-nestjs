import { PolicyEnforcementMode } from 'nest-keycloak-connect';
import { KeycloakConfigService } from './keycloak-config.service';

describe('KeycloakConfigService', () => {
	let service: KeycloakConfigService;

	beforeEach(() => {
		service = new KeycloakConfigService();
	});

	it('should return config with values from env', () => {
		process.env.KC_REALM = 'testrealm';
		process.env.KC_AUTH_SERVER_URL = 'testurl';
		process.env.KC_CLIENT_ID = 'testclientid';
		const conf = service.createKeycloakConnectOptions();
		expect(conf.realm).toBe('testrealm');
		expect(conf.authServerUrl).toBe('testurl');
		expect(conf.clientId).toBe('testclientid');
		expect(conf['ssl-required']).toBe('all');
		expect(conf.policyEnforcement).toBe(PolicyEnforcementMode.PERMISSIVE);
	});
});
