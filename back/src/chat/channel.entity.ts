import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity()
export class Channel extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500, unique: true })
  name: string;

  @Column()
  type: string;

  @Column({nullable: true})
  salt: number;

  @Column({nullable: true})
  password: string;

  @Column()
  owner: number;

  @Column( 'int', { array: true} )
  admins: number[];

  @Column('int', { array: true })
  users: number[];

  @Column('int', {array: true })
  bans: number[];

  @Column('int', {array: true, nullable: true})
  muted: number[];
}
