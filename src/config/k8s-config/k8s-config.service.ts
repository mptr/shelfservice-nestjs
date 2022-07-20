import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';

@Injectable()
export class K8sConfigService extends k8s.KubeConfig {
	constructor() {
		super();
		this.loadFromFile('./kubeconfig.yaml');
		this.addUser({
			name: process.env.K8S_USER,
			token: process.env.K8S_TOKEN,
		});
	}
	get namespace() {
		return 'default';
	}
}
