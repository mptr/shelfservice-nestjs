import { WorkflowDefinition } from 'src/workflows/workflow-definition.entity';
import { WorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { BaseEntity, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { JWToken } from 'src/util/requester.decorator';

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	readonly id: string;

	@Column()
	email: string;

	@Column()
	preferred_username: string;

	@Column()
	given_name: string;

	@Column()
	family_name: string;

	@ManyToMany(() => WorkflowDefinition, wf => wf.owners)
	workflows: WorkflowDefinition[];

	@OneToMany(() => WorkflowRun, wfrun => wfrun.ranBy)
	workflowRuns: WorkflowRun[];

	constructor(tok?: JWToken) {
		super();
		if (tok) Object.assign(this, tok);
	}
}
