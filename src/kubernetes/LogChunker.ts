import * as k8s from '@kubernetes/client-node';
import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { K8sJobService } from './k8s-job.service';

export class LogChunker {
	constructor(private readonly service: K8sJobService, private readonly run: KubernetesWorkflowRun) {}

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

		return this.service.getLogs(pod, sinceSeconds).catch(e => {
			if (this.hasSentAnything) throw e;
			else return '';
		});
	}

	private podCache?: k8s.V1Pod;
	private async getPod(): Promise<k8s.V1Pod> {
		if (this.podCache) return this.podCache;
		this.podCache = await this.service.getPodByName(this.run.jobTag);
		return this.podCache;
	}
}
