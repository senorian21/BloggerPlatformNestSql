import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentRepository } from '../../../comment/infrastructure/comment.repository';

export class DeleteCommentCommand {
  constructor(
    public commentId: number,
    public userId: number,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand, void>
{
  constructor(private commentRepository: CommentRepository) {}
  async execute({ commentId, userId }: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
        field: 'commentId',
      });
    }

    if (comment.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Unauthorized to update this comment',
        field: 'user',
      });
    }

    await this.commentRepository.softDeletedComment(commentId);
  }
}
