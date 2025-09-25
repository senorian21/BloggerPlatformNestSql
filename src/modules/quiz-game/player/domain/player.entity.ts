import {
  Column, CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../../user-accounts/user/domain/user.entity';
import { Answer } from '../../answer/domain/answer.entity';

@Entity('player')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  score: number;

  @OneToMany(() => Answer, (answer) => answer.player, { cascade: true })
  answers: Answer[];

  @CreateDateColumn()
  createdAt: Date;

  static create(userId: number) {
    const player = new Player();
    player.userId = userId;
    return player;
  }
}
