import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
 
@Entity({ name: 'game' })
class Game {
  @PrimaryGeneratedColumn()
  public id: number;
 
  @Column()
  scoreTrue: number;

  @Column()
  PlayerTrueId: number;
 
  @Column()
  scoreFalse: number;

  @Column()
  PlayerFalseId: number;

  @Column()
  powerUp: boolean;

  @Column()
  victoryId: number;
}
 
export default Game;