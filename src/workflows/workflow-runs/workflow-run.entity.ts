import { User } from 'src/users/user.entity';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { BaseEntity, ChildEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';
import { K8sJobService } from '../k8s-job.service';
import { Observable } from 'rxjs';
import { SetParameter } from '../parameter.entity';
import { JsonColumn } from 'src/util/json-column.decorator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowRun extends BaseEntity {
	constructor(wfDef?: WorkflowDefinition, u?: User, parameters?: SetParameter[]) {
		super();
		if (wfDef) this.workflowDefinition = Promise.resolve(wfDef); // TODO: remove checks
		if (u) this.ranBy = Promise.resolve(u);
		if (parameters) this.parameters = parameters;
	}

	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@ManyToOne(() => User, user => user.workflowRuns)
	ranBy: Promise<User>;

	workflowDefinition: Promise<WorkflowDefinition>;

	@Column({ nullable: true })
	startedAt: Date;

	@JsonColumn({ type: SetParameter, array: true })
	@Type(() => SetParameter)
	@ValidateNested()
	parameters: SetParameter[];

	// @OneToOne(() => WorkflowLog)
	log: Promise<any>;

	start(_svc: any) {
		this.startedAt = new Date();
		return this.save();
	}

	status(_: any) {
		throw new Error('Cannot get status from abstract WorkflowRun.');
	}

	streamLog(_: any) {
		throw new Error('Cannot get logs from abstract WorkflowRun.');
	}

	async jobTag() {
		return `${(await this.workflowDefinition).name}-${this.id}`;
	}
}

@ChildEntity()
export class KubernetesWorkflowRun extends WorkflowRun {
	constructor(wfDef?: KubernetesWorkflowDefinition, u?: User, parameters?: SetParameter[]) {
		super(wfDef, u, parameters);
	}

	@ManyToOne(() => KubernetesWorkflowDefinition, wdef => wdef.runs, { nullable: false })
	override workflowDefinition: Promise<KubernetesWorkflowDefinition>;

	override async start(jobService: K8sJobService) {
		await jobService.create({
			image: (await this.workflowDefinition).image,
			name: await this.jobTag(),
			env: this.parameters,
			command: (await this.workflowDefinition).command,
		});
		return super.start(jobService);
	}

	override async status(svc: K8sJobService) {
		if (await this.log) return null;
		else return svc.getJobStatus(await this.jobTag());
	}

	override async streamLog(svc: K8sJobService): Promise<Observable<string>> {
		return svc.getJobLogs(await this.jobTag());
	}
}

// @ChildEntity()
// export class WebWorkerWorkflowRun extends WorkflowRun {
// 	@ManyToOne(() => WebWorkerWorkflowDefinition, wdef => wdef.runs)
// 	override workflowDefinition: WebWorkerWorkflowDefinition;
// }
