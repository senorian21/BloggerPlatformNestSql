import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GameQueryRepository } from '../../infrastructure/query/game.query-repository';
import { GameViewDto } from '../../api/view-dto/game.view-dto';
import { GameRepository } from '../../infrastructure/game.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';

export class GetGameByIdForPlayerQuery {
  constructor(
    public gameId: string,
    public userId: number,
  ) {}
}

@QueryHandler(GetGameByIdForPlayerQuery)
export class GetGameByIdForPlayerQueryHandler
  implements IQueryHandler<GetGameByIdForPlayerQuery, GameViewDto>
{
  constructor(
    private gameQueryRepository: GameQueryRepository,
    private gameRepository: GameRepository,
    private playerRepository: PlayerRepository,
  ) {}

  async execute(query: GetGameByIdForPlayerQuery): Promise<GameViewDto> {
    const game = await this.gameRepository.findById(query.gameId);
    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Game not found',
      });
    }
    const player1 = await this.playerRepository.findByIdOrFail(
      game.player_1_id,
    );
    const player2 = game.player_2_id
      ? await this.playerRepository.findByIdOrFail(game.player_2_id)
      : null;

    const isParticipant =
      (player1 && player1.userId === query.userId) ||
      (player2 && player2.userId === query.userId);

    if (!isParticipant) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You are not a participant of this game',
      });
    }

    return this.gameQueryRepository.getGameViewByIdOrNotFoundFail(query.gameId);
  }
}
