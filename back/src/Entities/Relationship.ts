import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, OneToMany, Relation, ManyToOne, Unique} from "typeorm";
import DatabaseFile from "./Avatar";
import { User } from "./User";

@Entity({ name: 'relationships' })
@Unique(["idReceiver", "idSender"])
export class Relationship {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    idReceiver: number

    @Column()
    idSender: number

    @Column()
    type: string;
}
