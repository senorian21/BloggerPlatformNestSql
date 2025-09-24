import {
  Column, CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Player } from '../../player/domain/player.entity';

export enum AnswerStatus {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}

@Entity('answer')
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 300 })
  body: string;

  @Column({
    type: 'enum',
    enum: AnswerStatus,
  })
  answerStatus: AnswerStatus;

  @ManyToOne(() => Player, (player) => player.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column()
  playerId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  addedAt: Date;


  static create(isCorrect: boolean, userAnswer: string, playerId: number) {
    const answer = new Answer();
    answer.body = userAnswer;
    answer.answerStatus = isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect;
    answer.playerId = playerId;
    return answer;
  }
}
