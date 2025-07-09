import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../../comment/infrastructure/comment.repository';
import {
  LikeComment,
  likeCommentModelType,
  likeStatus,
} from '../../../like/domain/like=comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import { InjectModel } from '@nestjs/mongoose';

export class LikeStatusCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
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
    @InjectModel(LikeComment.name)
    private likeCommentModel: likeCommentModelType,
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

    const like = await this.commentRepository.findLikeByIdUser(
      userId,
      commentId,
    );

    if (!like) {
      const newLike = this.likeCommentModel.createLikeComment(
        commentId,
        userId,
        likeStatusReq,
      );

      await this.commentRepository.saveLike(newLike);

      comment.setLikeStatus(likeStatusReq, likeStatus.None);
      await this.commentRepository.save(comment);
    } else {
      const prevStatus = like.status;

      like.updateLikeComment(likeStatusReq);

      await this.commentRepository.saveLike(like);

      comment.setLikeStatus(likeStatusReq, prevStatus);
      await this.commentRepository.save(comment);
    }
  }
}
