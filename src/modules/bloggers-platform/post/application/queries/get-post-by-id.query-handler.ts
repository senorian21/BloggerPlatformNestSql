import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlogByIdQuery } from '../../../blog/application/queries/get-blog-by-id.query-handler';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';

export class GetPostByIdQuery {
  constructor(public id: string) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdQueryHandler
  implements IQueryHandler<GetBlogByIdQuery, PostViewDto>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute({ id }: GetPostByIdQuery) {
    return this.postQueryRepository.getByIdOrNotFoundFail(id);
  }
}
