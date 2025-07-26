import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AuthViewDto } from '../../api/view-dto/auth.view-dto';
import { AuthQueryRepository } from '../../infrastructure/query/auth.query-repository';

export class AboutUserQuery {
  constructor(public id: number) {}
}

@QueryHandler(AboutUserQuery)
export class AboutUserQueryHandler
  implements IQueryHandler<AboutUserQuery, AuthViewDto | null>
{
  constructor(private authQueryRepository: AuthQueryRepository) {}

  async execute(query: AboutUserQuery): Promise<AuthViewDto | null> {
    return this.authQueryRepository.me(query.id);
  }
}
