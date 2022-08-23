import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { interval, switchMap, takeUntil, Subject, Observable } from 'rxjs';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';
import { V1Job } from '@kubernetes/client-node';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { LogChunker } from './LogChunker';
import { WorkflowLogService } from 'src/workflow-logging/workflow-log.service';

@Injectable()
export class K8sJobService {
	protected readonly batchApi: k8s.BatchV1Api;
	protected readonly coreApi: k8s.CoreV1Api;
	constructor(
		protected readonly k8sConf: K8sConfigService,
		@Inject(forwardRef(() => WorkflowLogService))
		protected readonly logService: WorkflowLogService,
	) {
		this.batchApi = k8sConf.makeApiClient(k8s.BatchV1Api);
		this.coreApi = k8sConf.makeApiClient(k8s.CoreV1Api);
	}

	async getAllJobs() {
		const { body } = await this.batchApi.listNamespacedJob(this.k8sConf.namespace);
		return body.items;
	}

	protected async getJobByName(name: string) {
		const { body } = await this.batchApi.readNamespacedJob(name, this.k8sConf.namespace);
		return body;
	}

	async apply(run: KubernetesWorkflowRun) {
		const { body } = await this.batchApi.createNamespacedJob(this.k8sConf.namespace, {
			apiVersion: 'batch/v1',
			kind: 'Job',
			metadata: {
				name: run.jobTag,
				annotations: { jobName: run.workflowDefinition.sanitizedName, jobId: run.id },
			},
			spec: {
				template: {
					spec: {
						containers: [
							{
								image: run.workflowDefinition.image,
								name: run.jobTag,
								env: run.parameters,
								command: run.workflowDefinition.command,
							},
						],
						restartPolicy: 'Never',
					},
				},
				backoffLimit: 0,
			},
		});
		return body;
	}

	protected async getStatus(run: KubernetesWorkflowRun) {
		const { body } = await this.batchApi.readNamespacedJobStatus(run.jobTag, this.k8sConf.namespace);
		return body.status;
	}

	async getLogOnce(run: KubernetesWorkflowRun): Promise<string> {
		return new LogChunker(this.coreApi, this.k8sConf.namespace, run).getLatest();
	}

	getLogStream(run: KubernetesWorkflowRun): Observable<string> {
		// wrapper to fetch latest logs from k8s in a window-loke manner
		const logChunker = new LogChunker(this.coreApi, this.k8sConf.namespace, run);

		// signal to emit if job is no longer active and the stream should be closed
		const stopSignal = new Subject<void>();

		// refresh the log every 0.5 seconds
		return interval(500).pipe(
			switchMap(async () => {
				// fetch the status of the job
				const status = await this.getStatus(run);
				if (!status.active) {
					// if the job is no longer active, move its logs to the database
					await this.logService.processInactive(await this.getJobByName(run.jobTag));
					// and stop the stream
					stopSignal.next();
				}
				// return the latest log-contents
				return logChunker.getLatest();
			}),
			takeUntil(stopSignal), // stop when stopSignal was emitted
		);
	}

	async deleteJob(j: V1Job) {
		await this.batchApi.deleteNamespacedJob(j.metadata.name, this.k8sConf.namespace);
	}
}
