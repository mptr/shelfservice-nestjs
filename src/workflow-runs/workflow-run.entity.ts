import { User } from 'src/users/user.entity';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
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
import { SetParameter } from '../workflows/parameter.entity';
import { JsonColumn } from 'src/util/json-column.decorator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { LogStreamer } from 'src/workflow-logging/LogStreamer';
import { WorkflowRunLog } from './workflow-run-log.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowRun extends BaseEntity {
	constructor(wfDef?: WorkflowDefinition, u?: User, parameters?: SetParameter[]) {
		super();
		if (wfDef) this.workflowDefinition = wfDef;
		if (u) this.ranBy = u; // TODO: remove checks
		if (parameters) this.parameters = parameters;
	}

	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@ManyToOne(() => User, user => user.workflowRuns)
	ranBy: User;

	workflowDefinition: WorkflowDefinition;

	@Column({ nullable: true })
	startedAt: Date;

	@Column({ nullable: true })
	finishedAt: Date;

	@JsonColumn({ type: SetParameter, array: true, update: false })
	@Type(() => SetParameter)
	@ValidateNested()
	parameters: SetParameter[];

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
		this.startedAt = new Date();
		return this.save();
	}

	streamLog(_: unknown): LogStreamer {
		if (this.log) return new LogStreamer(this.log.data, this.logBlacklist);
		throw new Error('Cannot get logs from abstract WorkflowRun.');
	}

	async archive(result: boolean, logs: string) {
		this.result = result;
		this.log = new WorkflowRunLog(this, logs);
		this.finishedAt = new Date();
		await this.save();
		await this.log.save();
	}

	get jobTag() {
		return `${this.workflowDefinition.sanitizedName}-${this.id}`;
	}

	protected get logBlacklist(): string[] {
		return this.parameters.filter(p => p.hide).map(p => p.value);
	}
}

@ChildEntity()
export class KubernetesWorkflowRun extends WorkflowRun {
	constructor(wfDef?: KubernetesWorkflowDefinition, u?: User, parameters?: SetParameter[]) {
		super(wfDef, u, parameters);
	}

	@ManyToOne(() => KubernetesWorkflowDefinition, wdef => wdef.runs, { nullable: false })
	override workflowDefinition: KubernetesWorkflowDefinition;

	override async start(jobService: K8sJobService) {
		await jobService.apply(this);
		return super.start(jobService);
	}

	override streamLog(svc: K8sJobService): LogStreamer {
		if (this.log) return super.streamLog(svc);
		return new LogStreamer(svc.getLogStream(this), this.logBlacklist);
	}
}

// @ChildEntity()
// export class WebWorkerWorkflowRun extends WorkflowRun {
// 	@ManyToOne(() => WebWorkerWorkflowDefinition, wdef => wdef.runs)
// 	override workflowDefinition: WebWorkerWorkflowDefinition;
// }
