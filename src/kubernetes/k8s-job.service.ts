import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { Observable } from 'rxjs';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';
import { V1Job, V1Pod } from '@kubernetes/client-node';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';

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
					annotations: { jobName: run.workflowDefinition.name, jobId: run.id },
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

	async getLog(run: KubernetesWorkflowRun, latestOnly = false): Promise<string> {
		const pod = await this.getPodForWfRun(run);
		return this.getPodLogs({ podName: pod.metadata.name, latestOnly });
	}

	async getLogStream(run: KubernetesWorkflowRun): Promise<Observable<string>> {
		return new Observable<string>(subscriber => {
			let loopTimeout: NodeJS.Timeout; // loop timer
			let prevLogLen = 0; // length of previous emitted log

			const cancel = () => {
				// teardown
				clearTimeout(loopTimeout);
				subscriber.unsubscribe();
			};

			// loop function
			const refresh = async (latestOnly: boolean) => {
				const status = await this.getStatus(run); // get status to determine if job is done

				const logs = await this.getLog(run, latestOnly); // get logs

				subscriber.next(logs.substring(prevLogLen)); // emit only new section of log
				prevLogLen = logs.length; // update prevLogLen

				if (status.active) loopTimeout = setTimeout(() => refresh(true), 500); // re-run this function after 500ms
				else {
					subscriber.complete();
					cancel();
				}
			};
			refresh(false); // initial fetch
			return cancel; // teardown function
		});
	}

	async deleteJob(j: V1Job) {
		await this.batchApi.deleteNamespacedJob(j.metadata.name, this.k8sConf.namespace);
	}

	private async getPodForWfRun(wfRun: KubernetesWorkflowRun): Promise<V1Pod> {
		const pods = await this.coreApi.listNamespacedPod(
			this.k8sConf.namespace,
			undefined,
			undefined,
			undefined,
			undefined,
			`job-name=${wfRun.jobTag}`,
		);
		return pods.body.items[0];
	}

	private async getPodLogs(p: { podName: string; latestOnly: boolean }): Promise<string> {
		const logs = await this.coreApi.readNamespacedPodLog(
			p.podName,
			this.k8sConf.namespace,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			// p.latestOnly ? 2 : undefined, // grab only last 2 seconds of logs if flag is set // TODO
		);
		return logs.body;
	}
}
