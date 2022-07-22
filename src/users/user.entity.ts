import { WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { WorkflowRun } from 'src/workflows/workflow-runs/workflow-run.entity';
import { BaseEntity, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@Column()
	email: string;

	@Column()
	firstName: string;

	@Column()
	lastName: string;

	@ManyToMany(() => WorkflowDefinition, wf => wf.owners)
	workflows: Promise<WorkflowDefinition[]>;

	@OneToMany(() => WorkflowRun, wfrun => wfrun.ranBy)
	workflowRuns: Promise<WorkflowRun[]>;

	constructor(p?: Omit<User, 'id'>) {
		super();
		if (p) Object.assign(this, p);
	}
}
