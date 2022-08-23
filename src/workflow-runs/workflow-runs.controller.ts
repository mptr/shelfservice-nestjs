import { Controller, Get, Post, Body, Param, Redirect, Sse } from '@nestjs/common';
import { WorkflowDefinition } from '../workflows/workflow-definition.entity';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { WorkflowRun } from './workflow-run.entity';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Requester } from 'src/util/requester.decorator';
import { User } from 'src/users/user.entity';

@Controller('/workflows/:wfid/runs')
@ApiTags('workflow-runs')
@ApiBearerAuth('kc-token')
export class WorkflowRunsController {
	static accessPermission(user: User, defId: string, runId?: string) {
		return [
			{ id: runId, workflowDefinition: { id: defId, owners: { id: user.id } } },
			{ id: runId, workflowDefinition: { id: defId }, ranBy: { id: user.id } },
		];
	}

	constructor(protected readonly k8sService: K8sJobService) {}

	@Post()
	@Redirect()
	@ApiBody({ type: Object })
	async create(@Requester() user: User, @Param('wfid') wfId: string, @Body() parameters: Record<string, string>) {
		const wf = await WorkflowDefinition.findOneOrFail({ where: { id: wfId } });
		const wfr = await wf.run(user, parameters, this.k8sService);
		return { url: `runs/${wfr.id}` };
	}

	@Get()
	async findAll(@Requester() user: User, @Param('wfid') wfId: string) {
		const r = await WorkflowRun.find({
			where: WorkflowRunsController.accessPermission(user, wfId),
			relations: { ranBy: true },
		});
		return r;
	}

	@Get(':id')
	findOne(@Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		return WorkflowRun.findOneOrFail({
			where: WorkflowRunsController.accessPermission(user, wfId, id),
			relations: { workflowDefinition: { owners: true }, ranBy: true },
		});
	}

	@Sse(':id/log')
	async streamLog(@Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const wfr = await WorkflowRun.findOneOrFail({
			where: WorkflowRunsController.accessPermission(user, wfId, id),
			relations: { workflowDefinition: true, log: true },
		});

		return wfr.streamLog(this.k8sService).stream;
	}
}
