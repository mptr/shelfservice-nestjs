import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { Observable } from 'rxjs';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';
import { V1Pod } from '@kubernetes/client-node';

@Injectable()
export class K8sJobService {
	protected readonly batchApi: k8s.BatchV1Api;
	protected readonly coreApi: k8s.CoreV1Api;
	constructor(protected kcConf: K8sConfigService) {
		this.batchApi = kcConf.makeApiClient(k8s.BatchV1Api);
		this.coreApi = kcConf.makeApiClient(k8s.CoreV1Api);
	}

	async create(container: k8s.V1Container) {
		console.log('prepost');
		const { body } = await this.batchApi
			.createNamespacedJob(this.kcConf.namespace, {
				apiVersion: 'batch/v1',
				kind: 'Job',
				metadata: { name: container.name },
				spec: {
					template: { spec: { containers: [container], restartPolicy: 'Never' } },
					backoffLimit: 0,
				},
			})
			.catch(e => {
				console.log(e);
				throw new Error(e);
			});
		console.log('postpost');
		return body;
	}

	async getJobStatus(name: string) {
		const { body } = await this.batchApi.readNamespacedJobStatus(name, this.kcConf.namespace);
		return body.status;
	}

	async getPodForJob(name: string): Promise<V1Pod> {
		const pods = await this.coreApi.listNamespacedPod(
			this.kcConf.namespace,
			undefined,
			undefined,
			undefined,
			undefined,
			`job-name=${name}`,
		);
		return pods.body.items[0];
	}

	protected async getPodLogs(p: { podName: string; latestOnly: boolean }): Promise<string> {
		const logs = await this.coreApi.readNamespacedPodLog(
			p.podName,
			this.kcConf.namespace,
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

	getJobLogs(name: string): Observable<string> {
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
				const status = await this.getJobStatus(name); // get status to determine if job is done
				const pod = await this.getPodForJob(name);

				const logs = await this.getPodLogs({ podName: pod.metadata.name, latestOnly });

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
}
