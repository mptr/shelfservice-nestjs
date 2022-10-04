import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	Redirect,
	HttpException,
	HttpStatus,
	Query,
	Patch,
	Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FindOptionsWhere, Like } from 'typeorm';
import { User } from 'src/users/user.entity';
import { DiscriminatorPipe } from 'src/util/discriminator.pipe';
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
	private static readonly discriminatorPipe = new DiscriminatorPipe({
		discriminator: 'kind',
		map: {
			kubernetes: KubernetesWorkflowDefinition,
			webworker: WebWorkerWorkflowDefinition,
		},
	});

	@Post()
	@Redirect()
	async create(
		@Requester()
		user: User,
		@Body(WorkflowsController.discriminatorPipe)
		wfDef: WorkflowDefinition,
	) {
		if (!wfDef.owners) wfDef.owners = [];
		wfDef.owners.push(user);
		// remove duplicate owners
		wfDef.owners = wfDef.owners.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
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
			select: ['id', 'kind', 'name', 'icon', 'hasParams', 'description', 'createdAt'],
			where: where.length === 0 ? undefined : where,
			relations: { owners: true },
		});
	}

	findOne(id: string, res: Response): Promise<WorkflowDefinition<unknown> | void>;
	findOne(id: string): Promise<WorkflowDefinition<unknown>>;
	@Get(':id')
	async findOne(@Param('id') id: string, @Res() res?: Response): Promise<WorkflowDefinition<unknown> | void> {
		const wf = await WorkflowDefinition.findOneOrFail({
			where: { id },
			relations: { owners: true },
			withDeleted: true,
		});
		if (res && wf.replacedById) return res.redirect(wf.replacedById);
		if (wf.deletedAt) throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
		return wf;
	}

	@Patch(':id')
	@Redirect()
	async replace(
		@Requester() user: User,
		@Body(WorkflowsController.discriminatorPipe)
		wfDef: WorkflowDefinition,
		@Param('id') toReplaceId: string,
	) {
		const toReplace = await this.remove(user, toReplaceId); // remove the old one
		const newWf = await this.create(user, wfDef); // create the new one
		toReplace.replacedById = newWf.url; // set the replacement
		toReplace.save(); // save the old one with replace-id
		return newWf; // redirect to the new one
	}

	@Delete(':id')
	async remove(@Requester() user: User, @Param('id') id: string) {
		const r = await this.findOne(id);
		if (!r.owners.map(o => o.id).includes(user.id))
			throw new HttpException('You can only modify workflows owned by you', HttpStatus.FORBIDDEN);
		return WorkflowDefinition.softRemove(r);
	}
}
