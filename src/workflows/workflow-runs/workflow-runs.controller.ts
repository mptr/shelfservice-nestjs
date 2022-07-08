import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { UpdateWorkflowRunDto } from './dto/update-workflow-run.dto';

@Controller('workflow-runs')
export class WorkflowRunsController {
	constructor(private readonly workflowRunsService: WorkflowRunsService) {}

	@Post()
	create(@Body() createWorkflowRunDto: CreateWorkflowRunDto) {
		return this.workflowRunsService.create(createWorkflowRunDto);
	}

	@Get()
	findAll() {
		return this.workflowRunsService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.workflowRunsService.findOne(+id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateWorkflowRunDto: UpdateWorkflowRunDto) {
		return this.workflowRunsService.update(+id, updateWorkflowRunDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.workflowRunsService.remove(+id);
	}
}
