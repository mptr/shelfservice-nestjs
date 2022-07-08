export class CreateWorkflowDefinitionDto {
	name: string;
}

export class CreateKubernetesWorkflowDefinitionDto extends CreateWorkflowDefinitionDto {
	image: string;
	kind: 'kubernetes';
}
export class CreateWebWorkerWorkflowDefinitionDto extends CreateWorkflowDefinitionDto {
	script: string;
	kind: 'web-worker';
}
export type CreateAnyWorkflowDefinitionDto =
	| CreateKubernetesWorkflowDefinitionDto
	| CreateWebWorkerWorkflowDefinitionDto;
