import {
	BaseEntity,
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
import { KubernetesWorkflowRun, WorkflowRun } from './workflow-runs/workflow-run.entity';
import { K8sJobService } from './k8s-job.service';
import { Parameter, SetParameter } from './parameter.entity';
import { IsArray, IsDataURI, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonColumn } from 'src/util/json-column.decorator';
import { HttpException } from '@nestjs/common';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowDefinition extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@Column()
	readonly kind: string;

	@Column()
	@IsString()
	name: string;

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

	runs: Promise<WorkflowRun[]>;

	@JsonColumn({ type: Parameter, array: true })
	@Type(() => Parameter)
	@ValidateNested()
	parameterFields: Parameter[];

	@ManyToMany(() => User, user => user.workflows)
	owners: Promise<User[]>;

	async run(u: User, inps: Record<string, string>, svc: K8sJobService): Promise<WorkflowRun> {
		const setParams = this.parameterFields.map(p => p.accept(inps));
		const wfRun = await this.dispatch(u, setParams, svc).catch(e => {
			throw new HttpException(e.body, e.statusCode);
		});
		return wfRun.save();
	}

	protected dispatch(_u: User, _parameters: SetParameter[], _svc: any): Promise<WorkflowRun> {
		throw new Error('Cannot run abstract workflow');
	}
}

@ChildEntity()
export class KubernetesWorkflowDefinition extends WorkflowDefinition {
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
		const run = await new KubernetesWorkflowRun(this, u).save();
		return run.start(parameters, svc);
	}
}

// @ChildEntity()
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
