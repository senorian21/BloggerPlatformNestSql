import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameStatusPlayer, Player } from '../../player/domain/player.entity';
import { GameQuestion } from '../../questions/domain/game-question.entity';
import { Question } from '../../questions/domain/question.entity';

export enum GameStatus {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Active = 'Active',
  Finished = 'Finished',
}

@Entity('game')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.PendingSecondPlayer,
  })
  status: GameStatus;

  @OneToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_1_id' })
  player_1: Player;

  @Column()
  player_1_id: number;

  @OneToOne(() => Player, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'player_2_id' })
  player_2: Player | null;

  @Column({ nullable: true })
  player_2_id: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  pairCreatedDate: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  startGameDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  finishGameDate: Date | null;

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game, {
    cascade: true,
  })
  gameQuestions: GameQuestion[];

  static create(playerId: number): Game {
    const game = new Game();
    game.player_1_id = playerId;
    return game;
  }

  connectionSecondPlayer(playerId: number, questions: Question[]) {
    this.player_2_id = playerId;
    this.status = GameStatus.Active;
    this.startGameDate = new Date();

    this.gameQuestions = questions.map((q) => {
      const gq = new GameQuestion();
      gq.game = this;
      gq.questionId = q.id;
      return gq;
    });
  }

  finish(
    players: { p1: Player; p2: Player },
    stats: {
      lastAnswerP1?: Date;
      lastAnswerP2?: Date;
      correctCountP1: number;
      correctCountP2: number;
    },
  ) {
    if (stats.lastAnswerP1 && stats.lastAnswerP2) {
      if (stats.lastAnswerP1 < stats.lastAnswerP2 && stats.correctCountP1 > 0) {
        players.p1.addBonus();
      } else if (
        stats.lastAnswerP2 < stats.lastAnswerP1 &&
        stats.correctCountP2 > 0
      ) {
        players.p2.addBonus();
      }
    }

    if (players.p1.score > players.p2.score) {
      players.p1.status = GameStatusPlayer.Winner;
      players.p2.status = GameStatusPlayer.Losing;
    } else if (players.p2.score > players.p1.score) {
      players.p2.status = GameStatusPlayer.Winner;
      players.p1.status = GameStatusPlayer.Losing;
    } else {
      players.p1.status = GameStatusPlayer.Draw;
      players.p2.status = GameStatusPlayer.Draw;
    }

    this.status = GameStatus.Finished;
    this.finishGameDate = new Date();
  }
}
