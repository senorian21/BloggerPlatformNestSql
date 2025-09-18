import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blog-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export class GetAllBlogsQuery {
  constructor(public params: GetBlogsQueryParams) {}
}

@QueryHandler(GetAllBlogsQuery)
export class GetAllBlogsQueryHandler
  implements
    IQueryHandler<GetAllBlogsQuery, PaginatedViewDto<QuestionViewDto[]>>
{
  constructor(private blogsQueryRepository: BlogQueryRepository) {}

  async execute(
    query: GetAllBlogsQuery,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return this.blogsQueryRepository.getAll(query.params);
  }
}
