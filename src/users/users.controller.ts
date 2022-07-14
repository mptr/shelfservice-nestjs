import { Controller, Get, Post, Param, Delete, Sse } from '@nestjs/common';
import { User } from './user.entity';
import { Requester } from 'src/util/requester.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { Observable } from 'rxjs';

@Controller('users')
@ApiTags('users')
@Public()
export class UsersController {
	@Sse('time')
	time() {
		return new Observable(subscriber => {
			const i = setInterval(() => subscriber.next(new Date().toString()), 1000);
			return () => clearInterval(i);
		});
	}

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
