import { SessionsQueryRepository } from '../../infrastructure/query/security.query-repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';

export class GetAllSessionsByUserQuery {
  constructor(public userId: string) {}
}

@QueryHandler(GetAllSessionsByUserQuery)
export class GetAllSessionsByUserQueryHandler
  implements IQueryHandler<GetAllSessionsByUserQuery, SessionViewDto[] | null>
{
  constructor(private sessionsQueryRepository: SessionsQueryRepository) {}

  async execute(
    query: GetAllSessionsByUserQuery,
  ): Promise<SessionViewDto[] | null> {
    return this.sessionsQueryRepository.getAllSessionByUser(query.userId);
  }
}
