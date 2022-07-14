import { WorkflowRun } from 'src/workflows/workflow-runs/workflow-run.entity';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

	@OneToMany(() => WorkflowRun, wfrun => wfrun.ranBy)
	workflowRuns: WorkflowRun[];

	constructor(p?: Omit<User, 'id'>) {
		super();
		if (p) Object.assign(this, p);
	}
}
