import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetCommentQueryParams } from '../../api/input-dto/get-comment-query-params.input-dto';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';

export class GetAllCommentsQuery {
  constructor(
    public params: GetCommentQueryParams,
    public postId: string,
  ) {}
}

@QueryHandler(GetAllCommentsQuery)
export class GetAllCommentsQueryHandler
  implements
    IQueryHandler<GetAllCommentsQuery, PaginatedViewDto<CommentViewDto[]>>
{
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  async execute({
    params,
    postId,
  }: GetAllCommentsQuery): Promise<PaginatedViewDto<CommentViewDto[]>> {
    return this.commentsQueryRepository.getAll(params, postId);
  }
}
