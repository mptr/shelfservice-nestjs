import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Requester } from 'src/util/requester.decorator';

@Controller('users')
export class UsersController {
	@Post()
	create(@Body() createUserDto: CreateUserDto, @Requester() requester: User) {
		const u = new User(requester);
		return u.save();
	}

	@Get()
	findAll() {
		return User.find();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return User.findOne({ where: { id } });
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
		const u = await this.findOne(id);
		//
		return u.save();
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return User.delete({ id });
	}
}
