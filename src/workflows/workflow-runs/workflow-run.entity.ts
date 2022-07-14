import { User } from 'src/users/user.entity';
import { KubernetesWorkflowDefinition, WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import {
	BaseEntity,
	ChildEntity,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	TableInheritance,
} from 'typeorm';
import * as k8s from '@kubernetes/client-node';

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

	@CreateDateColumn()
	readonly createdAt: Date;

	@ManyToOne(() => WorkflowDefinition, wdef => wdef.runs)
	workflowDefinition: WorkflowDefinition;
}

@ChildEntity()
export class KubernetesWorkflowRun extends WorkflowRun {
	constructor(wfDef?: KubernetesWorkflowDefinition, u?: User, k8sjob?: k8s.V1Job) {
		super(wfDef, u);
	}

	@ManyToOne(() => KubernetesWorkflowDefinition, wdef => wdef.runs)
	override workflowDefinition: KubernetesWorkflowDefinition;
}

// @ChildEntity()
// export class WebWorkerWorkflowRun extends WorkflowRun {
// 	@ManyToOne(() => WebWorkerWorkflowDefinition, wdef => wdef.runs)
// 	override workflowDefinition: WebWorkerWorkflowDefinition;
// }
