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
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';

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
			return plainToInstance(JWToken, jwt);
		} catch (e) {
			throw new HttpException(JSON.stringify(e), HttpStatus.UNAUTHORIZED);
		}
	}
}

/**
 * Pipe to extract user object from request after user has been authenticated by guard
 */
@Injectable()
export class AuthDataPipe implements PipeTransform<any, any> {
	transform(req: any) {
		try {
			if (req.user) return req.user;
			else throw new Error('no user');
		} catch (e) {
			throw new HttpException('No authorization header present', HttpStatus.UNAUTHORIZED);
		}
	}
}

/**
 * @returns a parameter decorator to use in handlers where the requesting user entity is needed
 */
export const Requester = () => Request(AuthDataPipe, JwtPipe, JwtUserPipe);

/**
 * @returns a parameter decorator to use in handlers where the requesting user identity is needed
 */
export const RequesterJwt = () => Request(AuthDataPipe, JwtPipe);

// replaces the `@Request()` decorator from nest such that pipes can be used
const Request = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	return ctx.switchToHttp().getRequest();
});
