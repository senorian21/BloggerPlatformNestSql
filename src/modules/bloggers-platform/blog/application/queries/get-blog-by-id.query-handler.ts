import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';

export class GetBlogByIdQuery {
  constructor(public id: number) {}
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdQueryHandler
  implements IQueryHandler<GetBlogByIdQuery, QuestionViewDto>
{
  constructor(private blogsQueryRepository: BlogQueryRepository) {}

  async execute(query: GetBlogByIdQuery): Promise<QuestionViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(query.id);
  }
}
