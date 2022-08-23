import { Entity, BaseEntity, PrimaryGeneratedColumn, OneToOne, Column } from 'typeorm';
import { WorkflowRun } from './workflow-run.entity';

@Entity()
export class WorkflowRunLog extends BaseEntity {
	constructor(run?: WorkflowRun, data?: string) {
		super();
		if (run) this.run = run;
		if (data) this.data = data;
	}

	@PrimaryGeneratedColumn()
	id: number;

	@OneToOne(() => WorkflowRun, run => run.log, { nullable: false })
	run: WorkflowRun;

	@Column({ update: false })
	data: string;
}
