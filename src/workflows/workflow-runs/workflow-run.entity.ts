import { User } from 'src/users/user.entity';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { BaseEntity, ChildEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';
import { K8sJobService } from '../k8s-job.service';
import { Observable } from 'rxjs';
import { SetParameter } from '../parameter.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'kind' } })
export class WorkflowRun extends BaseEntity {
	constructor(wfDef?: WorkflowDefinition, u?: User) {
		super();
		this.workflowDefinition = wfDef;
		this.ranBy = u;
	}

	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@ManyToOne(() => User, user => user.workflowRuns)
	ranBy: User;

	workflowDefinition: WorkflowDefinition;

	@Column({ nullable: true })
	startedAt: Date;

	start(_parameters: SetParameter[], _: any) {
		this.startedAt = new Date();
		return this.save();
	}

	streamLog(_: any) {
		throw new Error('Cannot get logs from abstract WorkflowRun.');
	}

	get jobTag() {
		return `${this.workflowDefinition.name}-${this.id}`;
	}
}

@ChildEntity()
export class KubernetesWorkflowRun extends WorkflowRun {
	constructor(wfDef?: KubernetesWorkflowDefinition, u?: User) {
		super(wfDef, u);
	}

	@ManyToOne(() => KubernetesWorkflowDefinition, wdef => wdef.runs, { nullable: false })
	override workflowDefinition: KubernetesWorkflowDefinition;

	override async start(params: SetParameter[], jobService: K8sJobService) {
		await jobService.create({
			image: this.workflowDefinition.image,
			name: this.jobTag,
			env: params,
			command: this.workflowDefinition.command,
		});
		return super.start(params, jobService);
	}

	override streamLog(svc: K8sJobService): Observable<string> {
		return svc.getJobLogs(this.jobTag);
	}
}

// @ChildEntity()
// export class WebWorkerWorkflowRun extends WorkflowRun {
// 	@ManyToOne(() => WebWorkerWorkflowDefinition, wdef => wdef.runs)
// 	override workflowDefinition: WebWorkerWorkflowDefinition;
// }
