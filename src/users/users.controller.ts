import { Controller, Get, Post, Param, Delete } from '@nestjs/common';
import { User } from './user.entity';
import { Requester } from 'src/util/requester.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';

@Controller('users')
@ApiTags('users')
@Public()
export class UsersController {
	@Post()
	create(@Requester() requester: User) {
		return requester.save();
	}

	@Get()
	findAll() {
		return User.find();
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
