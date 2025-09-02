import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentRepository } from '../../../comment/infrastructure/comment.repository';
import { UpdateCommentDto } from '../../dto/create-comment.dto';

export class UpdateCommentCommand {
  constructor(
    public commentId: number,
    public userId: number,
    public dto: UpdateCommentDto,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand, void>
{
  constructor(private commentRepository: CommentRepository) {}
  async execute({
    commentId,
    userId,
    dto,
  }: UpdateCommentCommand): Promise<void> {
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

    comment.update(dto);
    await this.commentRepository.save(comment);
  }
}
