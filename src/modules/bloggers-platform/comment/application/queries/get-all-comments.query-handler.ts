import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {PaginatedViewDto} from '../../../../../core/dto/base.paginated.view-dto';
import {GetCommentQueryParams} from '../../api/input-dto/get-comment-query-params.input-dto';
import {CommentViewDto} from '../../api/view-dto/comment.view-dto';
import {CommentsQueryRepository} from '../../infrastructure/query/comments.query-repository';
import {PostRepository} from "../../../post/infrastructure/post.repository";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";

export class GetAllCommentsQuery {
  constructor(
    public params: GetCommentQueryParams,
    public postId: number,
    public userId?: number,
  ) {}
}

@QueryHandler(GetAllCommentsQuery)
export class GetAllCommentsQueryHandler
  implements
    IQueryHandler<GetAllCommentsQuery, PaginatedViewDto<CommentViewDto[]>>
{
  constructor(
      private commentsQueryRepository: CommentsQueryRepository,
      public postRepository: PostRepository,
      ) {}

  async execute({
    params,
    postId,
    userId,
  }: GetAllCommentsQuery): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Not Found',
      })
    }
    return this.commentsQueryRepository.getAll(params, postId, userId);
  }
}
