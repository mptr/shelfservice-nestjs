import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

	constructor(p?: Omit<User, 'id'>) {
		super();
		if (p) Object.assign(this, p);
	}
}
