import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import { Player } from '../../../player/domain/player.entity';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';
import { Game, GameStatus } from '../../domain/game.entity';
import { GameRepository } from '../../infrastructure/game.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { QuestionRepository } from '../../../questions/infrastructure/question.repository';
import { DataSource } from 'typeorm';

export class StatisticGameCommand {
  constructor(public userId: number) {}
}

@CommandHandler(StatisticGameCommand)
export class StatisticGameUseCase
  implements
    ICommandHandler<
      StatisticGameCommand,
      {
        sumScore: number;
        avgScores: number;
        gamesCount: number;
        winsCount: number;
        lossesCount: number;
        drawsCount: number;
      }
    >
{
  constructor(
    private usersExternalQueryRepository: UsersExternalQueryRepository,
    private playerRepository: PlayerRepository,
  ) {}

  async execute({ userId }: StatisticGameCommand): Promise<{
    sumScore: number;
    avgScores: number;
    gamesCount: number;
    winsCount: number;
    lossesCount: number;
    drawsCount: number;
  }> {
    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);

    return this.playerRepository.getUserStats(userId);
  }
}
