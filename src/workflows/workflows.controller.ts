import { Controller, Get, Post, Body, Param, Delete, Redirect, HttpException, HttpStatus } from '@nestjs/common';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Requester } from 'src/util/requester.decorator';
import { User } from 'src/users/user.entity';

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
	// @Post('webworker')
	// createWebworker(@Body() wfDef: WebWorkerWorkflowDefinition) {
	// 	return wfDef.save();
	// }

	protected async create(user: User, wfDef: WorkflowDefinition) {
		if (!wfDef.owners) wfDef.owners = [];
		wfDef.owners.push(user);
		wfDef = await wfDef.save();
		return { url: wfDef.id };
	}

	@Get()
	findAll() {
		return WorkflowDefinition.find({
			select: ['id', 'kind', 'name', 'icon', 'hasParams', 'description'],
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
