import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus, Query, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindOptionsWhere, Like } from 'typeorm';
import { User } from 'src/users/user.entity';
import { DiscriminatorPipe } from 'src/util/discriminator.pipe';
import { Redirection } from 'src/util/redirect.filter';
import { Requester } from 'src/util/requester.decorator';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from './workflow-definition.entity';

@Controller('workflows')
@ApiTags('workflows')
@ApiBearerAuth('kc-token')
export class WorkflowsController {
	private async getWfDef(id: string) {
		return KubernetesWorkflowDefinition.findOneOrFail({
			where: { id },
			relations: { owners: true },
			withDeleted: true,
		});
	}

	private async saveWfDef(user: User, wfDef: WorkflowDefinition) {
		if (!wfDef.owners) wfDef.owners = [];
		wfDef.owners.push(user);
		// remove duplicate owners
		wfDef.owners = wfDef.owners.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
		// @ts-ignore prevent updating by deleting id
		delete wfDef.id;
		return wfDef.save();
	}

	private static discriminatorMap = {
		kubernetes: KubernetesWorkflowDefinition,
		webworker: WebWorkerWorkflowDefinition,
	};

	private static readonly discriminatorPipe = new DiscriminatorPipe({
		discriminator: 'kind',
		map: WorkflowsController.discriminatorMap,
	});

	@Post()
	async create(
		@Requester()
		user: User,
		@Body(WorkflowsController.discriminatorPipe)
		wfDef: KubernetesWorkflowDefinition | WebWorkerWorkflowDefinition,
	) {
		const created = await this.saveWfDef(user, wfDef);
		throw new Redirection('workflows/' + created.id);
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
			select: ['id', 'kind', 'name', 'icon', 'hasParams', 'description', 'createdAt'],
			where: where.length === 0 ? undefined : where,
			relations: { owners: true },
		});
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const wf = await this.getWfDef(id);
		if (wf.replacedById) throw new Redirection(wf.replacedById, HttpStatus.SEE_OTHER);
		if (wf.deletedAt) throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
		console.log(wf?.image);
		return wf;
	}

	@Patch(':id')
	async replace(
		@Requester() user: User,
		@Body(WorkflowsController.discriminatorPipe)
		wfDef: KubernetesWorkflowDefinition | WebWorkerWorkflowDefinition,
		@Param('id') toReplaceId: string,
	) {
		const toReplace = await this.remove(user, toReplaceId); // remove the old one
		const newWf = await this.saveWfDef(user, wfDef); // create the new one
		toReplace.replacedById = newWf.id; // set the replacement
		await toReplace.save(); // save the old one with replace-id
		throw new Redirection(newWf.id, HttpStatus.SEE_OTHER); // redirect to new
	}

	@Delete(':id')
	async remove(@Requester() user: User, @Param('id') id: string) {
		const r = await this.findOne(id);
		if (!r.owners.map(o => o.id).includes(user.id))
			throw new HttpException('You can only modify workflows owned by you', HttpStatus.FORBIDDEN);
		return WorkflowDefinition.softRemove(r);
	}
}
