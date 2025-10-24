import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameRepository } from '../../infrastructure/game.repository';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';
import { AnswerRepository } from '../../../answer/infrastructure/answer.repository';
import { DataSource } from 'typeorm';
import { Answer } from '../../../answer/domain/answer.entity';

@Injectable()
export class GameCronService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_SECOND, {
    disabled: process.env.NODE_ENV === 'test',
  })
  async checkGames() {
    const games = await this.gameRepository.findActiveGamesWithQuestions();

    for (const g of games) {
      const totalQuestions = g.gameQuestions.length;
      const p1Answers = await this.answerRepository.countByPlayerId(
        g.player_1_id,
      );
      const p2Answers = await this.answerRepository.countByPlayerId(
        g.player_2_id!,
      );

      let finishedPlayerId: number | null = null;
      if (p1Answers >= totalQuestions && p2Answers < totalQuestions) {
        finishedPlayerId = g.player_1_id;
      }
      if (p2Answers >= totalQuestions && p1Answers < totalQuestions) {
        finishedPlayerId = g.player_2_id!;
      }

      if (finishedPlayerId) {
        const lastAnswer =
          await this.answerRepository.findLastAnswer(finishedPlayerId);

        if (lastAnswer && Date.now() - lastAnswer.addedAt.getTime() > 10_000) {
          await this.dataSource.transaction(async (m) => {
            const gRepo = this.gameRepository.withManager(m);
            const pRepo = this.playerRepository.withManager(m);
            const aRepo = this.answerRepository.withManager(m);

            const game = await gRepo.findById(g.id);
            if (!game) return;

            const p1 = await pRepo.findByIdOrFail(game.player_1_id);
            const p2 = await pRepo.findByIdOrFail(game.player_2_id!);

            if (p1Answers < totalQuestions) {
              for (const q of game.gameQuestions.slice(p1Answers)) {
                await aRepo.save(Answer.create(false, '', p1.id));
              }
            }
            if (p2Answers < totalQuestions) {
              for (const q of game.gameQuestions.slice(p2Answers)) {
                await aRepo.save(Answer.create(false, '', p2.id));
              }
            }

            const lastAnswerP1 = await aRepo.findLastAnswer(p1.id);
            const lastAnswerP2 = await aRepo.findLastAnswer(p2.id);
            const correctCountP1 = await aRepo.countCorrectByPlayerId(p1.id);
            const correctCountP2 = await aRepo.countCorrectByPlayerId(p2.id);

            game.finish(
              { p1, p2 },
              {
                lastAnswerP1: lastAnswerP1?.addedAt,
                lastAnswerP2: lastAnswerP2?.addedAt,
                correctCountP1,
                correctCountP2,
              },
            );

            await pRepo.save(p1);
            await pRepo.save(p2);
            await gRepo.save(game);
          });
        }
      }
    }
  }
}
