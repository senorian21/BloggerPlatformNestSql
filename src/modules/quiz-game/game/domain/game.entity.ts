import {Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Player} from "../../player/domain/player.entity";
import {GameQuestion} from "../../questions/domain/game-question.entity";

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

    @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game, { cascade: true })
    gameQuestions: GameQuestion[];

}


