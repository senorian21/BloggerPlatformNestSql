import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GameQueryRepository } from '../../infrastructure/query/game.query-repository';
import { GameViewDto } from '../../api/view-dto/game.view-dto';
import { GameRepository } from '../../infrastructure/game.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';

export class GetActiveGameForPlayerQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetActiveGameForPlayerQuery)
export class GetActiveGameForPlayerQueryHandler
  implements IQueryHandler<GetActiveGameForPlayerQuery, GameViewDto>
{
  constructor(
    private gameQueryRepository: GameQueryRepository,
    private gameRepository: GameRepository,
    private playerRepository: PlayerRepository,
  ) {}

  async execute(query: GetActiveGameForPlayerQuery): Promise<GameViewDto> {
    const player = await this.playerRepository.findByUserIdLastPlayer(
      query.userId,
    );
    if (!player) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Player not found.',
      });
    }

    const game = await this.gameRepository.findActiveGameByPlayer(player.id);
    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Game not found.',
      });
    }

    return this.gameQueryRepository.getGameViewByIdOrNotFoundFail(game.id);
  }
}
