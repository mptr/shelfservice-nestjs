import * as k8s from '@kubernetes/client-node';
import { Injectable } from '@nestjs/common';

@Injectable()
export class K8sConfigService extends k8s.KubeConfig {
	constructor() {
		super();
		this.loadFromFile(process.env['HOME'] + '/.kube/config');
	}
	get namespace() {
		return 'default';
	}
}
