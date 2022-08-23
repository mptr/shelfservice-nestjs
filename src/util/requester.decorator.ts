import {
	ArgumentMetadata,
	createParamDecorator,
	ExecutionContext,
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	PipeTransform,
	Type,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';

export class JWToken {
	@IsString()
	preferred_username: string;
	@IsString()
	given_name: string;
	@IsString()
	family_name: string;
	@IsEmail()
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
		@Inject(forwardRef(() => getRepositoryToken(User)))
		private readonly userRepo: Repository<User>,
	) {}

	async transform(jwt: any, metadata: ArgMetadata<User>): Promise<User> {
		// this should never happen (only on bad decorator usage)
		if (!metadata.metatype) throw new Error('Kein Metatype angegeben');

		const u = await this.userRepo.findOne({
			where: { preferred_username: jwt.preferred_username },
		});
		// throw if no entity (of kind `metatype`) found
		if (!u)
			throw new HttpException(
				'Requester ' + jwt.preferred_username + ' ist kein registrierter ' + metadata.metatype.name,
				HttpStatus.FORBIDDEN,
			);
		return u;
	}
}

/**
 * Pipe to validate jwt
 */
@Injectable()
export class JwtPipe implements PipeTransform<any, JWToken> {
	transform(jwt?: any) {
		try {
			const jwtInstance = plainToInstance(JWToken, jwt);
			return jwtInstance;
		} catch (e) {
			throw new HttpException(JSON.stringify(e), HttpStatus.UNAUTHORIZED);
		}
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
