import { Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';

@Injectable()
export class K8sConfigService extends k8s.KubeConfig {
	constructor() {
		super();
		this.loadFromFile('./kubeconfig.yaml');
		// this.loadFromOptions({
		// 	apiVersion: 'v1',
		// 	clusters: [
		// 		{
		// 			cluster: {
		// 				'certificate-authority-data':
		// 					'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUREekNDQWZlZ0F3SUJBZ0lVRWM5Wi9yaDhaSER1RnNSTGcvTzhqWFNlZkk0d0RRWUpLb1pJaHZjTkFRRUwKQlFBd0Z6RVZNQk1HQTFVRUF3d01NVEF1TVRVeUxqRTRNeTR4TUI0WERUSXlNRGN4TXpFMk5EZzFPRm9YRFRNeQpNRGN4TURFMk5EZzFPRm93RnpFVk1CTUdBMVVFQXd3TU1UQXVNVFV5TGpFNE15NHhNSUlCSWpBTkJna3Foa2lHCjl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUE4UmhhK1NuZndUT1ZCSEdoMldZVTlKdEwyK0kwWjZHaHMrblUKMU1SR3BRTVRwYzJYNUI0WWdGMnIrQ0F4WnFNOWNwOUhMeStpbWgxZ2JpS3AwZFJ1YU9WZ2FuS1RuRUc5ajFFdgo1OUtjNnpXZEFrWWt2alVRT2lFS05kYmZFd1ZwOVZXZXpYZU1QU3ZWczlEblYrQ2pONFh1bjAwU3M0WUExUkJ0CjY3NDd2bEY2V3RqdE4rbGQ0MlozVmR2VGJuSFNBYlpUL29yS2J2SHhranRTTzNTU0VpR1g5bnV5SWp5THVGb1MKSDl4Zm82bVRKbUNWTzdvUzZmRnlxZmxOZklhdGpkVUR0UFVPNWpZRXRuZCsycGwyaDZqdWsxMlgrclR1MHZUTwowUmMzL1pCS1JISC8wN2lYaDRVVElqR3F1U2MrbkYvb1dYclRTdVpuNWRqdzdrVi9Ud0lEQVFBQm8xTXdVVEFkCkJnTlZIUTRFRmdRVXhlZy9IbStKL1JiQ2pJVnB1c0RTb1dBZ054NHdId1lEVlIwakJCZ3dGb0FVeGVnL0htK0oKL1JiQ2pJVnB1c0RTb1dBZ054NHdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QU5CZ2txaGtpRzl3MEJBUXNGQUFPQwpBUUVBa2p5MDNWbmVTOGpmOUlKd1hLLzJGckVVb0xxOVVNNE1VK3pyQysrRG1CZ1plZzd5V2dXUENweTlucXE5CmsraWJsaXRidFBqZXNYNlZ4Nk9JOHREQmNZbWtxY1Q5VGtGN2pUWW1TUURBSGFHRDd1RUJ4endJMDEydVhpV2oKUDB1SStsUEFRZXk0V25BR2ZMSEh3VUJpdkhLU2ZkWFRNRTFuaDFCTW9yS1RpNWtmdUNudmkzMXBEZ3kvUGhLOQpsL2hHSnVPQ1VlTkRVWEVud0toa2JhRzVxQkNvTlFMQ2xNMHdHQVRSbFkrcmJWYzhZNjF4ZFQ2eUxWUDRsaExtCjhZU0NIc3hCQWluYXpEYlREUmF3TVFydWRuRkhnaHVYOFN4NUhSRlBlRFUwdmdDdHVUeEU0S0dvdUhXdnFESkkKV3U5dWRiaTB2QTZJNDd5cVdmOWh6RituK3c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
		// 				server: 'https://127.0.0.1:16443',
		// 			},
		// 			name: 'microk8s-cluster',
		// 		},
		// 	],
		// 	contexts: [
		// 		{
		// 			context: {
		// 				cluster: 'microk8s-cluster',
		// 				user: 'admin',
		// 			},
		// 			name: 'microk8s',
		// 		},
		// 	],
		// 	'current-context': 'microk8s',
		// 	kind: 'Config',
		// 	preferences: {},
		// 	users: [
		// 		{
		// 			name: 'admin',
		// 			user: {
		// 				token: process.env.MICROK8S_TOKEN,
		// 			},
		// 		},
		// 	],
		// });
	}
	get namespace() {
		return 'default';
	}
}
