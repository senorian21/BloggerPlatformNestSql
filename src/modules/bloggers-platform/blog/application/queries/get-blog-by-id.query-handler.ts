import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogQueryRepository } from '../../infrastructure/query/blog.query-repository';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';

export class GetBlogByIdQuery {
  constructor(public id: number) {}
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdQueryHandler
  implements IQueryHandler<GetBlogByIdQuery, BlogViewDto>
{
  constructor(private blogsQueryRepository: BlogQueryRepository) {}

  async execute(query: GetBlogByIdQuery): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(query.id);
  }
}
