import { Controller, Get, Post, Body, Param, Delete, Redirect, HttpException, HttpStatus, Query } from '@nestjs/common';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from './workflow-definition.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Requester } from 'src/util/requester.decorator';
import { User } from 'src/users/user.entity';
import { FindOptionsWhere, Like } from 'typeorm';

@Controller('workflows')
@ApiTags('workflows')
@ApiBearerAuth('kc-token')
export class WorkflowsController {
	static accessPermission(user: User, defId?: string) {
		return [{ id: defId, owners: { id: user.id } }];
	}

	@Post('kubernetes')
	@Redirect()
	createKubernetes(@Requester() user: User, @Body() wfDef: KubernetesWorkflowDefinition) {
		return this.create(user, wfDef);
	}

	@Post('webworker')
	@Redirect()
	createWebworker(@Requester() user: User, @Body() wfDef: WebWorkerWorkflowDefinition) {
		return this.create(user, wfDef);
	}

	protected async create(user: User, wfDef: WorkflowDefinition) {
		if (!wfDef.owners) wfDef.owners = [];
		wfDef.owners.push(user);
		wfDef = await wfDef.save();
		return { url: wfDef.id };
	}

	@Get()
	findAll(@Query('search') search = '') {
		const where: FindOptionsWhere<WorkflowDefinition<unknown>>[] = search
			.split(' ')
			.map(x => x.trim())
			.filter(x => x.length > 0)
			.flatMap(x => {
				const parts = [];
				['kind', 'name', 'description'].forEach(field => {
					parts.push({ [field]: Like(`%${x}%`) });
				});
				['given_name', 'family_name', 'preferred_username', 'email'].forEach(field => {
					parts.push({ owners: { [field]: Like(`%${x}%`) } });
				});
				if (x.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i))
					parts.push({ id: x }, { owners: { id: x } });
				return parts;
			});
		return WorkflowDefinition.find({
			select: ['id', 'kind', 'name', 'icon', 'hasParams', 'description'],
			where: where.length === 0 ? undefined : where,
			relations: { owners: true },
		});
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return WorkflowDefinition.findOne({ where: { id }, relations: { owners: true } });
	}

	@Delete(':id')
	async remove(@Requester() user: User, @Param('id') id: string) {
		const r = await this.findOne(id);
		if (!r.owners.map(o => o.id).includes(user.id))
			throw new HttpException('You can only delete workflows owned by you', HttpStatus.FORBIDDEN);
		return WorkflowDefinition.softRemove(r);
	}
}
