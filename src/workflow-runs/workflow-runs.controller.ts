import { Controller, Get, Post, Body, Param, Sse, Header, HttpStatus, HttpException, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from '../workflows/workflow-definition.entity';
import { User } from 'src/users/user.entity';
import { Redirection } from 'src/util/redirect.filter';
import { Requester } from 'src/util/requester.decorator';
import { WebWorkerResultDto, WebWorkerWorkflowRun, WorkflowRun } from './workflow-run.entity';

@Controller('/workflows/:wfid/runs')
@ApiTags('workflow-runs')
@ApiBearerAuth('kc-token')
export class WorkflowRunsController {
	private static ownerPermission(user: User, defId: string, runId?: string) {
		return { id: runId, workflowDefinition: { id: defId, owners: { id: user.id } } };
	}
	private static ranByPermission(user: User, defId: string, runId: string) {
		return { id: runId, workflowDefinition: { id: defId }, ranBy: { id: user.id } };
	}

	constructor(protected readonly k8sService: K8sJobService) {}

	@Post()
	@ApiBody({ type: Object })
	async create(@Requester() user: User, @Param('wfid') wfId: string, @Body() parameters: Record<string, string> = {}) {
		const wf = await WorkflowDefinition.findOneOrFail({ where: { id: wfId } });
		let wfr: WorkflowRun;
		if (wf instanceof KubernetesWorkflowDefinition) wfr = await wf.run(user, parameters, this.k8sService);
		else if (wf instanceof WebWorkerWorkflowDefinition) wfr = await wf.run(user, parameters);
		else throw new Error('Unknown workflow type');
		throw new Redirection(`runs/${wfr.id}`);
	}

	@Get()
	async findAll(@Requester() user: User, @Param('wfid') wfId: string) {
		const r = await WorkflowRun.find({
			where: WorkflowRunsController.ownerPermission(user, wfId),
			relations: { ranBy: true },
		});
		return r;
	}

	@Get(':id')
	async findOne(@Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const r = await WorkflowRun.findOneOrFail({
			where: [
				WorkflowRunsController.ownerPermission(user, wfId, id),
				WorkflowRunsController.ranByPermission(user, wfId, id),
			],
			relations: {
				workflowDefinition: { owners: true },
				ranBy: true,
			},
			relationLoadStrategy: 'query',
		});
		return r;
	}

	@Post(':id/log')
	async reportLog(
		@Requester() user: User,
		@Param('wfid') wfId: string,
		@Param('id') id: string,
		@Body() data: WebWorkerResultDto,
	) {
		const wfr = await WorkflowRun.findOneOrFail({
			where: WorkflowRunsController.ranByPermission(user, wfId, id),
			relations: { log: true },
		});
		if (!(wfr instanceof WebWorkerWorkflowRun))
			throw new HttpException(
				'External collected logs can only be posted for WebWorker Workflows',
				HttpStatus.NOT_FOUND,
			);
		await wfr.archive(data.result, data.log);
		return data;
	}

	@Sse(':id/log')
	async streamLog(@Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const wfr = await WorkflowRun.findOneOrFail({
			where: [
				WorkflowRunsController.ownerPermission(user, wfId, id), // or
				WorkflowRunsController.ranByPermission(user, wfId, id),
			],
			relations: {
				workflowDefinition: { owners: true },
				ranBy: true,
				log: true,
			},
			relationLoadStrategy: 'query',
		});
		return wfr.streamLog(this.k8sService).stream;
	}

	@Get(':id/worker.js')
	@Header('Content-Type', 'application/javascript')
	async getWorker(@Res() res: Response, @Requester() user: User, @Param('wfid') wfId: string, @Param('id') id: string) {
		const wfr = await this.findOne(user, wfId, id);
		if (wfr.ranBy.id !== user.id)
			throw new HttpException('Only workflow starting user can access worker script', HttpStatus.UNAUTHORIZED);
		if (!(wfr instanceof WebWorkerWorkflowRun))
			throw new HttpException('Only WebWorker Workflows can be fetched as script', HttpStatus.NOT_FOUND);
		await wfr.start();
		res.send(Buffer.from(wfr.workflowDefinition.script));
	}
}
