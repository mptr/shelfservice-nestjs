import { PartialType } from '@nestjs/mapped-types';
import {
	CreateKubernetesWorkflowDefinitionDto,
	CreateWebWorkerWorkflowDefinitionDto,
	CreateWorkflowDefinitionDto,
} from './create-workflow-definition.dto';

export class UpdateWorkflowDefinitionDto extends PartialType(CreateWorkflowDefinitionDto) {}
export class UpdateKubernetesWorkflowDefinitionDto extends PartialType(CreateKubernetesWorkflowDefinitionDto) {}
export class UpdateWebWorkerWorkflowDefinitionDto extends PartialType(CreateWebWorkerWorkflowDefinitionDto) {}
export type UpdateAnyWorkflowDefinitionDto =
	| UpdateKubernetesWorkflowDefinitionDto
	| UpdateWebWorkerWorkflowDefinitionDto;
