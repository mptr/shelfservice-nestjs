import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from './entities/workflow-definition.entity';
import { CreateAnyWorkflowDefinitionDto } from './dto/create-workflow-definition.dto';
import { UpdateAnyWorkflowDefinitionDto } from './dto/update-workflow-definition.dto';

@Controller('workflows')
export class WorkflowsController {
	@Post()
	create(@Body() createWorkflowDto: CreateAnyWorkflowDefinitionDto) {
		switch (createWorkflowDto.kind) {
			case 'kubernetes':
				return new KubernetesWorkflowDefinition(createWorkflowDto).save();
			case 'web-worker':
				return new WebWorkerWorkflowDefinition(createWorkflowDto).save();
		}
	}

	@Get()
	findAll() {
		return WorkflowDefinition.find();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return WorkflowDefinition.findOne({ where: { id } });
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateAnyWorkflowDefinitionDto) {
		const wf = await WorkflowDefinition.findOne({ where: { id } });
		//
		return wf.save();
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return WorkflowDefinition.delete({ id });
	}
}
