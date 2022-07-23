import { User } from 'src/users/user.entity';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import {
	BaseEntity,
	ChildEntity,
	Column,
	Entity,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	TableInheritance,
} from 'typeorm';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { Observable } from 'rxjs';
import { SetParameter } from '../workflows/parameter.entity';
import { JsonColumn } from 'src/util/json-column.decorator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowRun extends BaseEntity {
	constructor(wfDef?: WorkflowDefinition, u?: User, parameters?: SetParameter[]) {
		super();
		if (wfDef) this.workflowDefinition = wfDef;
		if (u) this.ranBy = Promise.resolve(u); // TODO: remove checks
		if (parameters) this.parameters = parameters;
	}

	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@ManyToOne(() => User, user => user.workflowRuns)
	ranBy: Promise<User>;

	workflowDefinition: WorkflowDefinition;

	@Column({ nullable: true })
	startedAt: Date;

	@JsonColumn({ type: SetParameter, array: true, update: false })
	@Type(() => SetParameter)
	@ValidateNested()
	parameters: SetParameter[];

	@OneToOne(() => WorkflowRunLog, log => log.run)
	log: Promise<WorkflowRunLog>;

	@Column({ nullable: true })
	result: boolean;

	@Column({
		generatedType: 'STORED',
		asExpression: `(
			CASE 
			WHEN startedAt IS NULL THEN 'prepared' 
			WHEN result IS TRUE THEN 'success'
			WHEN result IS FALSE THEN 'failure'
			ELSE 'running' 
			END
		)`,
	})
	readonly status: 'prepared' | 'running' | 'finished' | 'failed';

	start(_svc: any) {
		this.startedAt = new Date();
		return this.save();
	}

	streamLog(_: any) {
		throw new Error('Cannot get logs from abstract WorkflowRun.');
	}

	async archive(result: boolean, logs: string) {
		this.result = result;
		this.log = Promise.resolve(new WorkflowRunLog(this, logs));
		await this.save();
	}

	get jobTag() {
		return `${this.workflowDefinition.name}-${this.id}`;
	}
}

@ChildEntity()
export class KubernetesWorkflowRun extends WorkflowRun {
	constructor(wfDef?: KubernetesWorkflowDefinition, u?: User, parameters?: SetParameter[]) {
		super(wfDef, u, parameters);
	}

	@ManyToOne(() => KubernetesWorkflowDefinition, wdef => wdef.runs, { nullable: false, eager: true })
	override workflowDefinition: KubernetesWorkflowDefinition;

	override async start(jobService: K8sJobService) {
		await jobService.apply(this);
		return super.start(jobService);
	}

	override async streamLog(svc: K8sJobService): Promise<Observable<string>> {
		return svc.getLogStream(this);
	}
}

// @ChildEntity()
// export class WebWorkerWorkflowRun extends WorkflowRun {
// 	@ManyToOne(() => WebWorkerWorkflowDefinition, wdef => wdef.runs)
// 	override workflowDefinition: WebWorkerWorkflowDefinition;
// }

@Entity()
export class WorkflowRunLog extends BaseEntity {
	constructor(run?: WorkflowRun, data?: string) {
		super();
		if (run) this.run = run;
		if (data) this.data = data;
	}

	@PrimaryGeneratedColumn()
	id: number;

	@OneToOne(() => WorkflowRun, run => run.log, { eager: true, nullable: false })
	run: WorkflowRun;

	@Column({ update: false })
	data: string;
}
