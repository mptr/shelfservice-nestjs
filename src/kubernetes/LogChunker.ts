import * as k8s from '@kubernetes/client-node';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';

export class LogChunker {
	constructor(
		private readonly coreApi: k8s.CoreV1Api,
		private readonly namespace: string,
		private readonly run: KubernetesWorkflowRun,
	) {}

	private hasSentAnything = false;
	private lastFetch = 0;

	async getLatest(): Promise<string> {
		const l = await this.getLogs({ latestMsSinceNow: this.lastFetch ? Date.now() - this.lastFetch : undefined });
		if (l.length > 0) this.lastFetch = Date.now();

		this.hasSentAnything = this.hasSentAnything || l.length > 0;

		return this.removeOverlap(l);
	}

	private sent = '';
	private removeOverlap(l: string) {
		const scan = this.sent.substring(this.sent.length - l.length);

		let currentOverlap = 0;
		for (let i = 0; i < l.length; i++) {
			if (scan[i] === l[currentOverlap]) currentOverlap++;
			else currentOverlap = 0;
		}

		const result = l.substring(currentOverlap);
		this.sent += result;

		return result;
	}

	private async getLogs(p: { latestMsSinceNow?: number }): Promise<string> {
		const pod = await this.getPod();

		const sinceSeconds = p.latestMsSinceNow ? Math.floor((p.latestMsSinceNow + 1000) / 1000) : undefined;

		return this.coreApi
			.readNamespacedPodLog(
				pod.metadata.name,
				this.namespace,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				sinceSeconds,
			)
			.then(x => x.body || '')
			.catch(e => {
				if (this.hasSentAnything) throw e;
				else return '';
			});
	}

	private podCache?: k8s.V1Pod;
	private async getPod(): Promise<k8s.V1Pod> {
		if (this.podCache) return this.podCache;

		const pods = await this.coreApi.listNamespacedPod(
			this.namespace,
			undefined,
			undefined,
			undefined,
			undefined,
			`job-name=${this.run.jobTag}`,
		);

		this.podCache = pods.body.items[0];
		return this.podCache;
	}
}
