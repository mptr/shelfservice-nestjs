import { Type } from 'class-transformer';
import { IsArray, IsDataURI, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
	BaseEntity,
	Check,
	ChildEntity,
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Exclusion,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
	TableInheritance,
	Unique,
	UpdateDateColumn,
} from 'typeorm';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { User } from '../users/user.entity';
import { KubernetesWorkflowRun, WebWorkerWorkflowRun, WorkflowRun } from '../workflow-runs/workflow-run.entity';
import { JsonColumn } from 'src/util/json-column.decorator';
import { Parameter, SetParameter } from './parameter.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
@Check('workflow_kind_req', `"kind" IS NOT NULL AND "kind" <> 'WorkflowDefinition'`)
@Unique('workflow_name', ['name', 'deletedAt'])
export class WorkflowDefinition<S = any> extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@Column()
	readonly kind: string;

	@Column({ unique: true })
	@IsString()
	name: string;

	@Column({
		generatedType: 'STORED',
		asExpression: `lower(regexp_replace("name", '[^a-zA-Z0-9-]', '-', 'g'))`,
	})
	readonly sanitizedName: string;

	@Column()
	@IsString()
	description: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsDataURI()
	icon?: string;

	@Column({ nullable: true })
	replacedById?: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;

	@Column({
		generatedType: 'STORED',
		asExpression: `jsonb_array_length("parameterFields") > 0`,
		update: false,
		insert: false,
	})
	readonly hasParams: boolean;

	@OneToMany(() => WorkflowRun, run => run.workflowDefinition)
	runs: WorkflowRun[];

	@JsonColumn({
		type: Parameter,
		array: true,
		discriminator: Parameter.discriminator,
	})
	@Type(() => Parameter, {
		keepDiscriminatorProperty: true,
		discriminator: Parameter.discriminator,
	})
	@ValidateNested()
	parameterFields: Parameter[];

	@ManyToMany(() => User, user => user.workflows)
	@JoinTable({
		name: 'workflow_definition_owners',
		joinColumn: { name: 'workflow_definition_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
	})
	owners: User[];

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

	@Column({ type: 'jsonb' })
	@IsArray()
	@IsString({ each: true })
	command: string[];

	@OneToMany(() => KubernetesWorkflowRun, wfrun => wfrun.workflowDefinition)
	override runs: KubernetesWorkflowRun[];

	protected override async dispatch(
		u: User,
		parameters: SetParameter[],
		svc: K8sJobService,
	): Promise<KubernetesWorkflowRun> {
		return new KubernetesWorkflowRun(this, u, parameters).save().then(r => r.start(svc));
	}
}

@ChildEntity('webworker')
export class WebWorkerWorkflowDefinition extends WorkflowDefinition<never> {
	@Column({ type: 'text' })
	@IsString()
	script: string;

	@OneToMany(() => WebWorkerWorkflowRun, wfrun => wfrun.workflowDefinition)
	override runs: WebWorkerWorkflowRun[];

	override async run(u: User, inps: Record<string, string>): Promise<WorkflowRun> {
		return super.run(u, inps, null as never);
	}

	protected override async dispatch(u: User, parameters: SetParameter[]): Promise<WebWorkerWorkflowRun> {
		return new WebWorkerWorkflowRun(this, u, parameters).save();
	}
}
