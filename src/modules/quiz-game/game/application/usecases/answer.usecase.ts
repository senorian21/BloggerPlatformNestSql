import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GameRepository } from '../../infrastructure/game.repository';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GameStatus } from '../../domain/game.entity';
import { AnswerRepository } from '../../../answer/infrastructure/answer.repository';
import { Answer, AnswerStatus } from '../../../answer/domain/answer.entity';

export class AnswerCommand {
  constructor(
    public userId: number,
    public userAnswer: string,
  ) {}
}

@CommandHandler(AnswerCommand)
export class AnswerUseCase
  implements
    ICommandHandler<AnswerCommand, { answerId: number; questionId: number }>
{
  constructor(
    private gameRepository: GameRepository,
    private playerRepository: PlayerRepository,
    private answerRepository: AnswerRepository,
  ) {}

  async execute({
    userId,
    userAnswer,
  }: AnswerCommand): Promise<{ answerId: number; questionId: number }> {
    const player = await this.playerRepository.findByUserId(userId);
    if (!player) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Player not found.',
      });
    }

    const game = await this.gameRepository.findGameByPlayerId(player.id);
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

    const player1Answers = await this.answerRepository.countByPlayerId(
      game.player_1_id,
    );
    const player2Answers = await this.answerRepository.countByPlayerId(
      game.player_2_id!,
    );

    const totalQuestions = game.gameQuestions.length;

    if (player1Answers >= totalQuestions && player2Answers >= totalQuestions) {
      const lastAnswerP1 = await this.answerRepository.findLastAnswerTime(
        game.player_1_id,
      );
      const lastAnswerP2 = await this.answerRepository.findLastAnswerTime(
        game.player_2_id!,
      );

      const player1 = await this.playerRepository.findByIdOrFail(
        game.player_1_id,
      );
      const player2 = await this.playerRepository.findByIdOrFail(
        game.player_2_id!,
      );

      const answersP1 = await this.answerRepository.findByPlayerId(
        game.player_1_id,
      );
      const answersP2 = await this.answerRepository.findByPlayerId(
        game.player_2_id!,
      );

      const hasCorrectP1 = answersP1.some(
        (a) => a.answerStatus === AnswerStatus.Correct,
      );
      const hasCorrectP2 = answersP2.some(
        (a) => a.answerStatus === AnswerStatus.Correct,
      );

      if (lastAnswerP1 && lastAnswerP2) {
        if (lastAnswerP1 < lastAnswerP2 && hasCorrectP1) {
          player1.score += 1;
          await this.playerRepository.save(player1);
        } else if (lastAnswerP2 < lastAnswerP1 && hasCorrectP2) {
          player2.score += 1;
          await this.playerRepository.save(player2);
        }
      }

      game.status = GameStatus.Finished;
      game.finishGameDate = new Date();
      await this.gameRepository.save(game);
    }

    return { answerId: answer.id, questionId: question.id };
  }
}
