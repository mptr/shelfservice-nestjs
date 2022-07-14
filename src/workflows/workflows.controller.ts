import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from './workflow-definition.entity';
import { ApiTags } from '@nestjs/swagger';

import { Public } from 'nest-keycloak-connect';

@Controller('workflows')
@ApiTags('workflows')
@Public()
export class WorkflowsController {
	@Post('kubernetes')
	createKubernetes(@Body() wfDef: KubernetesWorkflowDefinition) {
		return wfDef.save();
	}
	// @Post('webworker')
	// createWebworker(@Body() wfDef: WebWorkerWorkflowDefinition) {
	// 	return wfDef.save();
	// }

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
