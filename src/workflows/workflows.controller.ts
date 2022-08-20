import { Controller, Get, Post, Body, Param, Delete, Redirect } from '@nestjs/common';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';
import { ApiTags } from '@nestjs/swagger';

import { Public } from 'nest-keycloak-connect';

@Controller('workflows')
@ApiTags('workflows')
@Public()
export class WorkflowsController {
	@Post('kubernetes')
	@Redirect()
	createKubernetes(@Body() wfDef: KubernetesWorkflowDefinition) {
		return this.create(wfDef);
	}
	// @Post('webworker')
	// createWebworker(@Body() wfDef: WebWorkerWorkflowDefinition) {
	// 	return wfDef.save();
	// }

	protected async create(wfDef: WorkflowDefinition) {
		console.log('new workflow');
		console.log(wfDef);
		wfDef = await wfDef.save();
		return { url: wfDef.id };
	}

	@Get()
	findAll() {
		return WorkflowDefinition.find({
			select: ['id', 'kind', 'name', 'icon', 'hasParams', 'owners', 'description'],
			// relations: {
			// 	owners: {
			// 		id: true,
			// 		firstName: true,
			// 		lastName: true,
			// 	},
			// },
		});
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return WorkflowDefinition.findOne({ where: { id } });
	}

	// @Patch(':id')
	// async update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateAnyWorkflowDefinitionDto) {
	// 	const wf = await WorkflowDefinition.findOne({ where: { id } });
	// 	//
	// 	return wf.save();
	// }

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return WorkflowDefinition.softRemove(await this.findOne(id));
	}
}
