import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { WorkflowDefinition } from '../workflow-definition.entity';
import { K8sJobService } from '../k8s-job.service';
import { WorkflowRun } from './workflow-run.entity';

@Controller('/workflows/:wfid/runs')
@Public()
export class WorkflowRunsController {
	constructor(protected readonly k8sService: K8sJobService) {}

	@Post()
	async create(@Param('wfid') wfId: string, @Body() parameters: Record<string, string>) {
		const wf = await WorkflowDefinition.findOneOrFail({ where: { id: wfId } });
		return wf.run(null, parameters, this.k8sService);
	}

	@Get()
	findAll(@Param('wfid') wfId: string) {
		return WorkflowRun.find({ where: { workflowDefinition: { id: wfId } } });
	}

	@Get(':id')
	findOne(@Param('wfid') wfId: string, @Param('id') id: string) {
		return WorkflowRun.findOneOrFail({ where: { id, workflowDefinition: { id: wfId } } });
	}
}
