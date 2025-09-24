import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {
    UsersExternalQueryRepository
} from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import {GameRepository} from "../../infrastructure/game.repository";
import {PlayerRepository} from "../../../player/infrastructure/player.repository";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";
import {GameStatus} from "../../domain/game.entity";
import {AnswerRepository} from "../../../answer/infrastructure/answer.repository";
import {Answer} from "../../../answer/domain/answer.entity";


export class AnswerCommand {
    constructor(
        public userId: number,
        public userAnswer: string,
    ) {}
}

@CommandHandler(AnswerCommand)
export class AnswerUseCase implements ICommandHandler<AnswerCommand, void> {
    constructor(
        private gameRepository: GameRepository,
        private playerRepository: PlayerRepository,
        private answerRepository: AnswerRepository,
    ) {}

    async execute({ userId, userAnswer }: AnswerCommand) {
        const player = await this.playerRepository.findByUserId(userId);
        if (!player) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'Player not found.',
            });
        }

        const game = await this.gameRepository.findGameByPlayerId(player.id,);
        if (!game || game.status !== GameStatus.Active) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'Active game not found.',
            });
        }

        const answersCount = await this.answerRepository.countByPlayerId(player.id);

        const nextGameQuestion = game.gameQuestions[answersCount];
        if (!nextGameQuestion) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'No more questions left for this player.',
            });
        }

        const question = nextGameQuestion.question;

        const isCorrect = question.correctAnswers.includes(userAnswer);

        const answer = Answer.create(isCorrect, userAnswer, player.id);
        await this.answerRepository.save(answer);

        if (isCorrect) {
            player.score += 1;
            await this.playerRepository.save(player);
        }

        const player1Answers = await this.answerRepository.countByPlayerId(game.player_1_id);
        const player2Answers = await this.answerRepository.countByPlayerId(game.player_2_id!);

        const totalQuestions = game.gameQuestions.length;

        if (player1Answers >= totalQuestions && player2Answers >= totalQuestions) {
            game.status = GameStatus.Finished;
            game.finishGameDate = new Date();
            await this.gameRepository.save(game);
        }
    }
}
