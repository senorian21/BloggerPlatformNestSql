import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "../../game/domain/game.entity";
import {Question} from "./question.entity";


@Entity('gameQuestion')
export class GameQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Game, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gameId' })
    game: Game;

    @Column()
    gameId: string;

    @ManyToOne(() => Question, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question: Question;

    @Column()
    questionId: number;
}
