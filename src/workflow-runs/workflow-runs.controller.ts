import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Redirect,
	Sse,
	Header,
	HttpStatus,
	HttpException,
	Res,
} from '@nestjs/common';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from '../workflows/workflow-definition.entity';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { WebWorkerWorkflowRun, WorkflowRun } from './workflow-run.entity';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Requester } from 'src/util/requester.decorator';
import { User } from 'src/users/user.entity';
import { Response } from 'express';

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
		let wfr: WorkflowRun;
		if (wf instanceof KubernetesWorkflowDefinition) wfr = await wf.run(user, parameters, this.k8sService);
		else if (wf instanceof WebWorkerWorkflowDefinition) wfr = await wf.run(user, parameters);
		else throw new Error('Unknown workflow type');
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
	async findOne(@Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const r = await WorkflowRun.findOneOrFail({
			where: WorkflowRunsController.accessPermission(user, wfId, id),
			relations: {
				workflowDefinition: { owners: true },
				ranBy: true,
			},
			relationLoadStrategy: 'query',
		});
		console.log(r);
		return r;
	}

	@Sse(':id/log')
	async streamLog(@Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const wfr = await this.findOne(user, wfId, id);
		return wfr.streamLog(this.k8sService).stream;
	}

	@Get(':id/worker.js')
	@Header('Content-Type', 'application/javascript')
	// @Header('Content-Disposition', 'attachment; filename=worker.js')
	async getWorker(@Res() res: Response, @Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const wfr = await this.findOne(user, wfId, id);
		if (!(wfr instanceof WebWorkerWorkflowRun))
			throw new HttpException('Only WebWorker Workflows can be fetched as script', HttpStatus.NOT_FOUND);
		await wfr.start();
		res.send(Buffer.from(WebWorkerWorkflowRun.webwokerExtensionScript + wfr.workflowDefinition.script));
	}
}
