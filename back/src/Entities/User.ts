import { getRepository, AfterUpdate, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, OneToMany, ManyToOne, Relation} from "typeorm";
import DatabaseFile from "./Avatar";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
@Entity({ name: 'users' })
export class User {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column({nullable: true})
    socket: string;

    @Column({nullable: true})
    socketgame: string;

    @Column({nullable: true})
    secret?: string;

    @Column()
    valid: boolean;
    
    @JoinColumn({ name: 'avatarId' })
    @OneToOne(() => DatabaseFile, { nullable: true })
    public avatar?: DatabaseFile;

    @Column({ nullable: true })
    public avatarId?: number;

    @Column('float')
    level: number;

    @Column( 'int', { array: true, nullable: true} )
    blockedby: number[];

    @Column( 'int', { array: true, nullable: true} )
    blocked: number[];

}
