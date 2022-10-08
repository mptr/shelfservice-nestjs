import { HttpException, HttpStatus } from '@nestjs/common';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';
import {
	BaseEntity,
	ChildEntity,
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	TableInheritance,
} from 'typeorm';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { SetVariable } from '../workflows/parameter.entity';
import { User } from 'src/users/user.entity';
import { JsonColumn } from 'src/util/json-column.decorator';
import { LogStreamer } from 'src/workflow-logging/LogStreamer';
import {
	KubernetesWorkflowDefinition,
	WebWorkerWorkflowDefinition,
	WorkflowDefinition,
} from 'src/workflows/workflow-definition.entity';
import { WorkflowRunLog } from './workflow-run-log.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowRun extends BaseEntity {
	constructor(wfDef?: WorkflowDefinition, u?: User, parameters?: SetVariable[]) {
		super();
		if (wfDef) this.workflowDefinition = wfDef;
		if (u) this.ranBy = u;
		if (parameters) this.setParameters = parameters;
	}

	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@ManyToOne(() => User, user => user.workflowRuns)
	ranBy: User;

	@ManyToOne(() => WorkflowDefinition, wfDef => wfDef.runs)
	workflowDefinition: WorkflowDefinition;

	@Column({ nullable: true })
	startedAt: Date;

	@Column({ nullable: true })
	finishedAt: Date;

	@JsonColumn({ type: SetVariable, array: true, update: false })
	@Type(() => SetVariable)
	@ValidateNested()
	@Exclude({ toClassOnly: true })
	protected setParameters: SetVariable[];

	@Exclude() // this getter is used internally only
	get variablesUnfiltered(): SetVariable[] {
		return this.setParameters.concat(
			new SetVariable({ name: 'IDENTITY_USERNAME', value: this.ranBy.preferred_username }),
			new SetVariable({ name: 'IDENTITY_EMAIL', value: this.ranBy.email }),
			new SetVariable({ name: 'IDENTITY_FIRSTNAME', value: this.ranBy.given_name }),
			new SetVariable({ name: 'IDENTITY_LASTNAME', value: this.ranBy.family_name }),
		);
	}

	@Expose() // this getter returns a filtered list of parameters for the client
	get variables(): SetVariable[] {
		return this.variablesUnfiltered.map((p: SetVariable) => new SetVariable({ ...p, value: p.hide ? '***' : p.value }));
	}

	@OneToOne(() => WorkflowRunLog, log => log.run)
	@JoinColumn()
	log: WorkflowRunLog;

	@Column({ nullable: true })
	result: boolean;

	@Column({
		generatedType: 'STORED',
		asExpression: `(
			CASE 
			WHEN "startedAt" IS NULL THEN 'prepared' 
			WHEN result IS TRUE THEN 'success'
			WHEN result IS FALSE THEN 'failure'
			ELSE 'running' 
			END
		)`,
	})
	readonly status: 'prepared' | 'running' | 'success' | 'failure';

	start(_svc: unknown) {
		if (this.status !== 'prepared' && this.status !== undefined)
			throw new HttpException('This workflow has already started', HttpStatus.UNPROCESSABLE_ENTITY);
		this.startedAt = new Date();
		return this.save();
	}

	streamLog(_: unknown): LogStreamer {
		if (this.log) return new LogStreamer(this.log.data);
		throw new Error('Cannot get logs from abstract WorkflowRun.');
	}

	async archive(result: boolean, logs: string) {
		if (this.log) throw new HttpException('This workflow is already archived', HttpStatus.NOT_ACCEPTABLE);
		this.result = result;
		this.log = new WorkflowRunLog(this, logs);
		this.finishedAt = new Date();
		await this.save();
		await this.log.save();
	}

	get jobTag() {
		return `${this.workflowDefinition.sanitizedName}-${this.id}`;
	}
}

@ChildEntity()
export class KubernetesWorkflowRun extends WorkflowRun {
	constructor(wfDef?: KubernetesWorkflowDefinition, u?: User, parameters?: SetVariable[]) {
		super(wfDef, u, parameters);
	}

	@ManyToOne(() => KubernetesWorkflowDefinition, wdef => wdef.runs, { nullable: false })
	override workflowDefinition: KubernetesWorkflowDefinition;

	override async start(jobService: K8sJobService) {
		const r = await super.start(jobService);
		await jobService.apply(this);
		return r;
	}

	override streamLog(svc: K8sJobService): LogStreamer {
		if (this.log) return super.streamLog(svc);
		return new LogStreamer(svc.getLogStream(this));
	}
}

@ChildEntity()
export class WebWorkerWorkflowRun extends WorkflowRun {
	@ManyToOne(() => WebWorkerWorkflowDefinition, wdef => wdef.runs)
	override workflowDefinition: WebWorkerWorkflowDefinition;

	@Expose() // for web workers params cant be filtered, client needs to know the values
	override get variables(): SetVariable[] {
		return this.variablesUnfiltered;
	}

	override async start() {
		return super.start(undefined);
	}
}

export class WebWorkerResultDto {
	@IsString()
	log: string;

	@IsBoolean()
	result: boolean;
}
