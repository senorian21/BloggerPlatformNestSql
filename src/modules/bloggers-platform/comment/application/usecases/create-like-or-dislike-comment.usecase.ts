import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../../comment/infrastructure/comment.repository';
import {
  likeStatus,
} from '../../../like/domain/like-comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';

export class LikeStatusCommentCommand {
  constructor(
    public commentId: number,
    public userId: number,
    public likeStatusReq: likeStatus,
  ) {}
}

@CommandHandler(LikeStatusCommentCommand)
export class LikeStatusCommentUseCase
  implements ICommandHandler<LikeStatusCommentCommand, void>
{
  constructor(
    private commentRepository: CommentRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}
  async execute({
    commentId,
    userId,
    likeStatusReq,
  }: LikeStatusCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `Comment with id ${commentId} not found`,
      });
    }

    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `User with id ${userId} not found`,
      });
    }

    const newLike = this.commentRepository.createLikeComment(
      commentId,
      userId,
      likeStatusReq,
    );
  }
}
