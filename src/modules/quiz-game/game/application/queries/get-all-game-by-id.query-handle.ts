import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GameQueryRepository } from '../../infrastructure/query/game.query-repository';
import { GameViewDto } from '../../api/view-dto/game.view-dto';
import { GetGamesQueryParams } from '../../api/input-dto/get-game-query-params.input-dto';

export class GetAllGamesQuery {
  constructor(
    public userId: number,
    public readonly params: GetGamesQueryParams,
  ) {}
}

@QueryHandler(GetAllGamesQuery)
export class GetAllGamesQueryHandler
  implements
    IQueryHandler<
      GetAllGamesQuery,
      {
        pagesCount: number;
        page: number;
        pageSize: number;
        totalCount: number;
        items: GameViewDto[];
      }
    >
{
  constructor(private readonly gameQueryRepository: GameQueryRepository) {}

  async execute({ userId, params }: GetAllGamesQuery): Promise<{
    pagesCount: number;
    page: number;
    pageSize: number;
    totalCount: number;
    items: GameViewDto[];
  }> {
    return this.gameQueryRepository.getAllGames(userId, params);
  }
}
