import {
	BaseEntity,
	Check,
	ChildEntity,
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
	TableInheritance,
	UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { KubernetesWorkflowRun, WorkflowRun } from '../workflow-runs/workflow-run.entity';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { Parameter, SetParameter } from './parameter.entity';
import { IsArray, IsDataURI, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonColumn } from 'src/util/json-column.decorator';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
@Check('workflow_kind_req', `"kind" IS NOT NULL AND "kind" <> 'WorkflowDefinition'`)
export class WorkflowDefinition<S = any> extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@Column()
	readonly kind: string;

	@Column()
	@IsString()
	name: string;

	@Column()
	@IsString()
	description: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsDataURI()
	icon: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;

	@Column({
		generatedType: 'STORED',
		asExpression: `"parameterFields" != ('[]')::jsonb`,
	})
	readonly hasParams: boolean;

	runs: Promise<WorkflowRun[]>;

	@JsonColumn({ type: Parameter, array: true })
	@Type(() => Parameter)
	@ValidateNested()
	parameterFields: Parameter[];

	@ManyToMany(() => User, user => user.workflows)
	owners: Promise<User[]>;

	async run(u: User, inps: Record<string, string>, svc: S): Promise<WorkflowRun> {
		const setParams = this.parameterFields.map(p => p.accept(inps));
		return this.dispatch(u, setParams, svc);
	}

	protected async dispatch(_u: User, _parameters: SetParameter[], _svc: S): Promise<WorkflowRun> {
		throw new Error('Cannot dispatch abstract workflow');
	}
}

@ChildEntity('kubernetes')
export class KubernetesWorkflowDefinition extends WorkflowDefinition<K8sJobService> {
	@Column()
	@IsString()
	image: string;

	@Column({ type: 'json' })
	@IsArray()
	@IsString({ each: true })
	command: string[];

	@OneToMany(() => KubernetesWorkflowRun, wfrun => wfrun.workflowDefinition)
	override runs: Promise<KubernetesWorkflowRun[]>;

	protected override async dispatch(
		u: User,
		parameters: SetParameter[],
		svc: K8sJobService,
	): Promise<KubernetesWorkflowRun> {
		return new KubernetesWorkflowRun(this, u, parameters).save().then(r => r.start(svc));
	}
}

// @ChildEntity('webworker')
// export class WebWorkerWorkflowDefinition extends WorkflowDefinition {
// 	@Column()
// 	script: string;

// 	@OneToMany(() => WebWorkerWorkflowRun, wfrun => wfrun.workflowDefinition)
// 	override runs: WebWorkerWorkflowRun[];

// 	constructor(wf?: CreateWebWorkerWorkflowDefinitionDto) {
// 		super(wf);
// 		this.script = wf.script;
// 	}

// 	override run(u: User, parameters: SetParameter[]): Promise<WebWorkerWorkflowRun> {
// 		return null;
// 	}
// }
