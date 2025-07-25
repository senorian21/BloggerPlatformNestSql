import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { UserQueryRepository } from '../../infrastructure/query/user.query-repository';

export class GetUserByIdQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery, UserViewDto>
{
  constructor(private userQueryRepository: UserQueryRepository) {}

  async execute({ userId }: GetUserByIdQuery): Promise<UserViewDto> {
    return this.userQueryRepository.getByIdOrNotFoundFail(userId);
  }
}
