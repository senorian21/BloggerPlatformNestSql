import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';

export class GetCommentsByIdQuery {
  constructor(public commentId: string) {}
}

@QueryHandler(GetCommentsByIdQuery)
export class GetCommentsByIdQueryHandler
  implements IQueryHandler<GetCommentsByIdQuery, CommentViewDto>
{
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  async execute({ commentId }: GetCommentsByIdQuery): Promise<CommentViewDto> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(commentId);
  }
}
