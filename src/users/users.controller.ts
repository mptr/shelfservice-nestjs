import { Controller, Get, Param, Delete, Put, HttpException, HttpStatus } from '@nestjs/common';
import { User } from './user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JWToken, Requester, RequesterJwt } from 'src/util/requester.decorator';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('kc-token')
export class UsersController {
	@Put(':username')
	async create(@RequesterJwt() requester: JWToken, @Param('username') username: string) {
		if (requester.preferred_username !== username)
			throw new HttpException('You can only create your own user', HttpStatus.FORBIDDEN);
		await User.upsert(new User(requester), {
			conflictPaths: ['preferred_username'],
			skipUpdateIfNoValuesChanged: true,
		});
		return true;
	}

	@Get()
	findAll() {
		return User.find();
	}

	@Get('self')
	findSelf(@Requester() requester: User) {
		return this.findOne(requester.id);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return User.findOne({ where: { id } });
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return User.delete({ id });
	}
}
