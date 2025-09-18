import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blog-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';

export class GetAllBlogsQuery {
  constructor(public params: GetBlogsQueryParams) {}
}

@QueryHandler(GetAllBlogsQuery)
export class GetAllBlogsQueryHandler
  implements IQueryHandler<GetAllBlogsQuery, PaginatedViewDto<BlogViewDto[]>>
{
  constructor(private blogsQueryRepository: BlogQueryRepository) {}

  async execute(
    query: GetAllBlogsQuery,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query.params);
  }
}
