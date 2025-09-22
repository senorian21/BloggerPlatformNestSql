import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Player} from "../../player/domain/player.entity";

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
}

