import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import { AuthGuard } from 'nest-keycloak-connect';
import { AuthDataPipe, JWToken } from 'src/util/requester.decorator';

const headerKey = 'x-mockauth';

// this mock pipe can be used to mock jwt validation by using a proprietary header
@Injectable()
class MockAuthDataPipe extends AuthDataPipe {
	override transform(req: any): any {
		return JSON.parse(decodeURIComponent(req.headers[headerKey])); // unmarshal
	}
}

// this helper can be used within supertest to mock a used jwt
// ...get('/route').set(as('Max Muster')).expect(200)
export const as = (jwt: JWToken | string) => {
	if (typeof jwt === 'string') {
		const [first, last] = jwt.split(' ');
		jwt = new JWToken();
		jwt.preferred_username = (first[0] + last).toLowerCase();
		jwt.given_name = first;
		jwt.family_name = last;
		jwt.email = jwt.preferred_username + '@example.com';
	}
	return { [headerKey]: encodeURIComponent(JSON.stringify(jwt)) }; // marshal
};

// helper to modify a testing module to use the mock auth pipe
export const installMockAuth = (app: TestingModuleBuilder) => {
	return app
		.overrideProvider(AuthGuard)
		.useValue({
			canActivate: (ctx: ExecutionContext) => {
				// reject if no token present
				const tokenPresent = ctx.switchToHttp().getRequest().headers[headerKey];
				if (tokenPresent) return true;
				else throw new UnauthorizedException();
			},
		})
		.overridePipe(AuthDataPipe)
		.useClass(MockAuthDataPipe);
};
