import { V1Job } from '@kubernetes/client-node';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';

@Injectable()
export class WorkflowLogService {
	constructor(protected readonly k8sService: K8sJobService) {}
	// every 10 seconds
	@Cron('*/10 * * * * *')
	async collectLogs() {
		const js = await this.k8sService.getAllJobs();
		console.log('collecting logs', js.length);
		js.forEach(j => {
			if (j.status.active) this.processActive(j);
			else this.processInactive(j);
		});
	}

	async processInactive(j: V1Job) {
		if (j.status.active) return;

		console.log('cleaning up job:', j.metadata.name);

		// get the workflow run
		const wfRun = await KubernetesWorkflowRun.findOne({
			where: { id: j.metadata.annotations.jobId },
			relations: { workflowDefinition: true },
			withDeleted: true,
		});
		if (!wfRun) return console.warn("can't find workflow run for job:", j.metadata.name);

		if (wfRun.result !== null) return; // do nothing if workflow run has already been marked as finished

		// store logs in the database
		await wfRun.archive(!j.status.failed, await this.k8sService.getLogOnce(wfRun));

		// delete the job
		await this.k8sService.deleteJob(j);
	}

	async processActive(j: V1Job) {
		const JOB_CANCEL_TIMEOUT = 10 * 60 * 1000;
		if (j.status.startTime.getTime() + JOB_CANCEL_TIMEOUT >= new Date().getTime())
			return console.log(j.metadata.name, 'is still running'); // do nothing if job is younger than JOB_CANCEL_TIMEOUT
		console.warn('stale job detected:', j.metadata.name); // TODO: WARN USER
	}
}
