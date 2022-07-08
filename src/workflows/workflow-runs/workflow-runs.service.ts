import { Injectable } from '@nestjs/common';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { UpdateWorkflowRunDto } from './dto/update-workflow-run.dto';

@Injectable()
export class WorkflowRunsService {
	create(createWorkflowRunDto: CreateWorkflowRunDto) {
		return 'This action adds a new workflowRun';
	}

	findAll() {
		return `This action returns all workflowRuns`;
	}

	findOne(id: number) {
		return `This action returns a #${id} workflowRun`;
	}

	update(id: number, updateWorkflowRunDto: UpdateWorkflowRunDto) {
		return `This action updates a #${id} workflowRun`;
	}

	remove(id: number) {
		return `This action removes a #${id} workflowRun`;
	}
}
