import {
	ArgumentMetadata,
	createParamDecorator,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
	PipeTransform,
	Type,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';

export interface JWToken {
	email_verified: boolean;
	name: string;
	preferred_username: string;
	given_name: string;
	family_name: string;
	email: string;
}
interface ArgMetadata<T> extends ArgumentMetadata {
	readonly metatype?: Type<T>;
}

/**
 * Pipe to obtain User entity from authenticated user through jwt
 */
@Injectable()
export class JwtUserPipe implements PipeTransform<JWToken, Promise<User>> {
	constructor(
		@InjectRepository(User)
		protected userRepo: Repository<User>,
	) {}

	async transform(jwt: any, metadata: ArgMetadata<User>): Promise<User> {
		/* istanbul ignore next */ // this should never happen (only on bad decorator usage)
		if (!metadata.metatype) throw new Error('No metatype supplied');
		const u = await this.userRepo.findOne({
			where: {
				email: jwt.email,
			},
		});
		// throw if no entity (of kind `metatype`) found
		if (!u)
			throw new HttpException(
				'Requester ' + jwt.email + ' is not a registered ' + metadata.metatype.name,
				HttpStatus.FORBIDDEN,
			);
		return u;
	}
}

/**
 * Pipe to validate jwt
 */
@Injectable()
export class JwtPipe implements PipeTransform {
	transform(jwt?: any) {
		// check if the email is present in the jwt
		if (!jwt || !jwt.email || !jwt.given_name || !jwt.family_name)
			throw new HttpException('Token lacks email, given_name or family_name', HttpStatus.UNAUTHORIZED);
		return jwt;
	}
}

/**
 * @returns a parameter decorator to use in handlers where the requesting user entity is needed
 */
export const Requester = () => AuthedUser(JwtPipe, JwtUserPipe);

export const RequesterJwt = () => AuthedUser(JwtPipe);

// copied from AuthenticatedUser-Decorator (nest-keycloak-connect)
// this should pass entire request to next pipe if req.user does not exist
/* istanbul ignore next */ // this is covered in e2e tests
export const AuthedUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest();
	return req.user || req;
});
