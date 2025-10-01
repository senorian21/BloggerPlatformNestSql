import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTopUsersQueryParams } from '../../../game/api/input-dto/get-top-user-query-params.input-dto';
import { PlayerQueryRepository } from '../../infrastructure/query/player.query-repository';
import { TopUserViewDto } from '../../api/view-dto/top-user.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export class GetTopUsersQuery {
  constructor(public prams: GetTopUsersQueryParams) {}
}

@QueryHandler(GetTopUsersQuery)
export class GetTopUsersQueryHandler
  implements IQueryHandler<GetTopUsersQuery, PaginatedViewDto<TopUserViewDto[]>>
{
  constructor(private playerQueryRepository: PlayerQueryRepository) {}

  async execute(
    query: GetTopUsersQuery,
  ): Promise<PaginatedViewDto<TopUserViewDto[]>> {
    return this.playerQueryRepository.getTopUsers(query.prams);
  }
}
