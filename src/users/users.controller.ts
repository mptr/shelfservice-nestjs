import { Controller, Get, Param, Delete, Put, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JWToken, Requester, RequesterJwt } from 'src/util/requester.decorator';
import { User } from './user.entity';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('kc-token')
export class UsersController {
	@Put(':username')
	async save(@RequesterJwt() requester: JWToken, @Param('username') username: string) {
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
		await User.delete({ id });
		return true;
	}
}
