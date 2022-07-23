import { Controller, Get, Post, Body, Param, Redirect, Sse } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { WorkflowDefinition } from '../workflows/workflow-definition.entity';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { WorkflowRun } from './workflow-run.entity';
import { ApiBody } from '@nestjs/swagger';

@Controller('/workflows/:wfid/runs')
@Public()
export class WorkflowRunsController {
	constructor(protected readonly k8sService: K8sJobService) {}

	@Post()
	@Redirect('', 201)
	@ApiBody({ type: Object })
	async create(@Param('wfid') wfId: string, @Body() parameters: Record<string, string>) {
		const wf = await WorkflowDefinition.findOneOrFail({ where: { id: wfId } });
		const wfr = await wf.run(null, parameters, this.k8sService);
		return { url: `runs/${wfr.id}` };
	}

	@Get()
	findAll(@Param('wfid') wfId: string) {
		return WorkflowRun.find({
			where: { workflowDefinition: { id: wfId } },
			select: ['id', 'ranBy', 'status'],
		});
	}

	@Get(':id')
	findOne(@Param('wfid') wfId: string, @Param('id') id: string) {
		return WorkflowRun.findOneOrFail({
			where: { id, workflowDefinition: { id: wfId } },
			relations: { workflowDefinition: true },
		});
	}

	@Sse(':id/log')
	async streamLog(@Param('wfid') wfId: string, @Param('id') id: string) {
		const wfr = await WorkflowRun.findOneOrFail({
			where: { id, workflowDefinition: { id: wfId } },
		});
		if (wfr.status !== 'running') return null;
		return wfr.streamLog(this.k8sService);
	}
}
