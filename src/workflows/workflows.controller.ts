import { Controller, Get, Post, Body, Param, Delete, Redirect } from '@nestjs/common';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';
import { ApiTags } from '@nestjs/swagger';

import { Public } from 'nest-keycloak-connect';

@Controller('workflows')
@ApiTags('workflows')
@Public()
export class WorkflowsController {
	@Post('kubernetes')
	@Redirect('', 201)
	createKubernetes(@Body() wfDef: KubernetesWorkflowDefinition) {
		return this.create(wfDef);
	}
	// @Post('webworker')
	// createWebworker(@Body() wfDef: WebWorkerWorkflowDefinition) {
	// 	return wfDef.save();
	// }

	protected async create(wfDef: WorkflowDefinition) {
		wfDef = await wfDef.save();
		return { url: wfDef.id };
	}

	@Get()
	findAll() {
		return WorkflowDefinition.find({ select: ['id', 'name'] });
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
