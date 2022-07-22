import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as path from 'path';

@Injectable()
export class K8sConfigService extends k8s.KubeConfig {
	constructor() {
		super();
		this.loadFromFile(path.join(__dirname, 'kubeconfig.yaml'));
		console.log('keyloen', process.env.K8S_KEY.length);
		this.addUser({
			name: process.env.K8S_USER,
			token: process.env.K8S_TOKEN,
			keyData: process.env.K8S_KEY,
			certData: process.env.K8S_CERT,
		});
	}
	get namespace() {
		return 'default';
	}
}
