import {
	BaseEntity,
	ChildEntity,
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	TableInheritance,
	UpdateDateColumn,
} from 'typeorm';
import { Observable } from 'rxjs';
import { User } from 'src/users/entities/user.entity';
import {
	CreateKubernetesWorkflowDefinitionDto,
	CreateWebWorkerWorkflowDefinitionDto,
	CreateWorkflowDefinitionDto,
} from '../dto/create-workflow-definition.dto';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowDefinition extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@Column()
	readonly kind: string;

	@Column()
	name: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(wf?: CreateWorkflowDefinitionDto) {
		super();
		this.name = wf.name;
	}

	run(u: User, parameters: string[]): Observable<string> {
		throw new Error('Cannot run abstract workflow');
	}
}

@ChildEntity()
export class KubernetesWorkflowDefinition extends WorkflowDefinition {
	@Column()
	image: string;

	constructor(wf?: CreateKubernetesWorkflowDefinitionDto) {
		super(wf);
		this.image = wf.image;
	}

	override run(u: User, parameters: string[]): Observable<string> {
		return null;
	}
}

@ChildEntity()
export class WebWorkerWorkflowDefinition extends WorkflowDefinition {
	@Column()
	script: string;

	constructor(wf?: CreateWebWorkerWorkflowDefinitionDto) {
		super(wf);
		this.script = wf.script;
	}

	override run(u: User, parameters: string[]): Observable<string> {
		return null;
	}
}
