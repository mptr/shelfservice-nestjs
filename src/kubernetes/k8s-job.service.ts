import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { Observable } from 'rxjs';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';
import { V1Job } from '@kubernetes/client-node';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { LogChunker } from './LogChunker';
import { LogStreamer } from 'src/workflow-logging/LogStreamer';

@Injectable()
export class K8sJobService {
	protected readonly batchApi: k8s.BatchV1Api;
	protected readonly coreApi: k8s.CoreV1Api;
	constructor(protected k8sConf: K8sConfigService) {
		this.batchApi = k8sConf.makeApiClient(k8s.BatchV1Api);
		this.coreApi = k8sConf.makeApiClient(k8s.CoreV1Api);
	}

	async getAllJobs() {
		const { body } = await this.batchApi.listNamespacedJob(this.k8sConf.namespace);
		return body.items;
	}

	async apply(run: KubernetesWorkflowRun) {
		const { body } = await this.batchApi
			.createNamespacedJob(this.k8sConf.namespace, {
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
			})
			.catch(e => {
				console.log(e.body);
				throw new Error(e);
			});
		return body;
	}

	async getStatus(run: KubernetesWorkflowRun) {
		const { body } = await this.batchApi.readNamespacedJobStatus(run.jobTag, this.k8sConf.namespace);
		return body.status;
	}

	async getLogOnce(run: KubernetesWorkflowRun): Promise<string> {
		return new LogChunker(this.coreApi, this.k8sConf.namespace, run).getLatest();
	}

	getLogStream(run: KubernetesWorkflowRun): LogStreamer {
		const o = new Observable<string>(subscriber => {
			let loopTimeout: NodeJS.Timeout; // loop timer

			const cancel = () => {
				// teardown
				clearTimeout(loopTimeout);
				subscriber.unsubscribe();
			};

			const logChunker = new LogChunker(this.coreApi, this.k8sConf.namespace, run);

			// loop function
			const refresh = async () => {
				const status = await this.getStatus(run); // get status to determine if job is done

				subscriber.next(await logChunker.getLatest()); // emit only new section of log

				if (status.active) loopTimeout = setTimeout(() => refresh(), 500); // re-run this function after 500ms
				else {
					subscriber.complete();
					cancel();
				}
			};
			refresh(); // initial fetch
			return cancel; // teardown function
		});
		return new LogStreamer(o);
	}

	async deleteJob(j: V1Job) {
		await this.batchApi.deleteNamespacedJob(j.metadata.name, this.k8sConf.namespace);
	}
}
