import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export class GetAllPostQuery {
  constructor(
    public params: GetPostQueryParams,
    public blogId?: string,
    public userId?: string | null,
  ) {}
}

@QueryHandler(GetAllPostQuery)
export class GetAllPostQueryHandler
  implements IQueryHandler<GetAllPostQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute(
    query: GetAllPostQuery,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postQueryRepository.getAll(
      query.params,
      query.blogId,
      query.userId,
    );
  }
}
