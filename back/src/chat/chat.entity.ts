import {User} from '../Entities/User';

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: number;

	@Column({ nullable: true })
	sender: string;

    @Column({ unique: false })
    text: string;
    
    @Column({ unique: false })
    userid: number;

    @CreateDateColumn()
    createdAt: Date;

	@Column({nullable: true })
	channel: string;

    @Column( 'int', { array: true} )
    users: number[];
}
