import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GameRepository } from '../../infrastructure/game.repository';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AnswerRepository } from '../../../answer/infrastructure/answer.repository';
import { Answer } from '../../../answer/domain/answer.entity';
import { DataSource } from 'typeorm';

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
    private readonly gameRepository: GameRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    userId,
    userAnswer,
  }: AnswerCommand): Promise<{ answerId: number; questionId: number }> {
    return this.dataSource.transaction(async (manager) => {
      const gameRepo = this.gameRepository.withManager(manager);
      const playerRepo = this.playerRepository.withManager(manager);
      const answerRepo = this.answerRepository.withManager(manager);

      const game = await gameRepo.findActiveGameByUserId(userId);
      if (!game) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'Active game not found.',
        });
      }

      const player = await playerRepo.findByUserIdAndGameId(userId, game.id);
      if (!player) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'Player not found in this game.',
        });
      }

      const answersCount = await answerRepo.countByPlayerId(player.id);
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
      await answerRepo.save(answer);

      if (isCorrect) {
        player.score += 1;
        await playerRepo.save(player);
      }

      const player1Answers = await answerRepo.countByPlayerId(game.player_1_id);
      const player2Answers = await answerRepo.countByPlayerId(
        game.player_2_id!,
      );
      const totalQuestions = game.gameQuestions.length;

      if (
        player1Answers >= totalQuestions &&
        player2Answers >= totalQuestions
      ) {
        const lastAnswerP1 = await answerRepo.findLastAnswer(game.player_1_id);
        const lastAnswerP2 = await answerRepo.findLastAnswer(game.player_2_id!);
        const correctCountP1 = await answerRepo.countCorrectByPlayerId(
          game.player_1_id,
        );
        const correctCountP2 = await answerRepo.countCorrectByPlayerId(
          game.player_2_id!,
        );

        const p1 = await playerRepo.findByIdOrFail(game.player_1_id);
        const p2 = await playerRepo.findByIdOrFail(game.player_2_id!);

        game.finish(
          { p1, p2 },
          {
            lastAnswerP1: lastAnswerP1?.addedAt,
            lastAnswerP2: lastAnswerP2?.addedAt,
            correctCountP1,
            correctCountP2,
          },
        );

        await playerRepo.save(p1);
        await playerRepo.save(p2);
        await gameRepo.save(game);
      }

      return { answerId: answer.id, questionId: question.id };
    });
  }
}
