import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetUserQueryParams } from '../../api/input-dto/get-user-query-params.input-dto';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { UserQueryRepository } from '../../infrastructure/query/user.query-repository';

export class GetAllUsersQuery {
  constructor(public params: GetUserQueryParams) {}
}

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersQueryHandler
  implements IQueryHandler<GetAllUsersQuery, PaginatedViewDto<UserViewDto[]>>
{
  constructor(private userQueryRepository: UserQueryRepository) {}

  async execute(
    query: GetAllUsersQuery,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.userQueryRepository.getAll(query.params);
  }
}
