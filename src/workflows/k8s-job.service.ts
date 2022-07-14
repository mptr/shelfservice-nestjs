import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { Observable } from 'rxjs';
import { K8sConfigService } from 'src/config/k8s-config/k8s-config.service';

@Injectable()
export class K8sJobService {
	protected readonly batchApi: k8s.BatchV1Api;
	protected readonly coreApi: k8s.CoreV1Api;
	constructor(protected kcConf: K8sConfigService) {
		this.batchApi = kcConf.makeApiClient(k8s.BatchV1Api);
		this.coreApi = kcConf.makeApiClient(k8s.CoreV1Api);
	}

	async create(container: k8s.V1Container) {
		const { body } = await this.batchApi.createNamespacedJob(this.kcConf.namespace, {
			apiVersion: 'batch/v1',
			kind: 'Job',
			metadata: { name: container.name },
			spec: {
				template: {
					spec: {
						containers: [container],
						restartPolicy: 'Never',
					},
				},
				backoffLimit: 0,
			},
		});
		return body;
	}

	async getJobStatus(name: string) {
		const { body } = await this.batchApi.readNamespacedJob(this.kcConf.namespace, name);
		return body.status;
		// const status = await this.batchApi.readNamespacedJobStatus('pi', 'default');
		// console.log(status.body);

		// get all pods that run the job
		// const pods = await this.coreApi.listNamespacedPod(
		// 	'default',
		// 	undefined,
		// 	undefined,
		// 	undefined,
		// 	undefined,
		// 	'job-name=pi',
		// );
		// obtain their logs
		// const logs = await this.coreApi.readNamespacedPodLog(pods.body.items[0].metadata.name, 'default');
		// console.log(logs.body);
		// return logs;
	}

	getJobLogs(name: string): Observable<string> {
		return new Observable<string>(subscriber => {
			const cancel = () => {
				clearInterval(interval);
				subscriber.unsubscribe();
			};
			const refresh = async () => {
				const status = await this.getJobStatus(name);
				const logs = await this.coreApi.readNamespacedPodLog(name, this.kcConf.namespace);
				subscriber.next(logs.body);
				if (!status.active) {
					subscriber.complete();
					cancel();
				}
			};
			const interval = setInterval(() => refresh(), 500);
			refresh();
			return cancel;
		});
	}
}
