import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkflowRunDto } from './create-workflow-run.dto';

export class UpdateWorkflowRunDto extends PartialType(CreateWorkflowRunDto) {}
