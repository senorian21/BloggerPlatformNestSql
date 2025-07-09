import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentDto } from '../../../comment/dto/create-comment.dto';
import {
  Comment,
  CommentModelType,
} from '../../../comment/domain/comment.entity';
import { PostRepository } from '../../infrastructure/post.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import { CommentRepository } from '../../../comment/infrastructure/comment.repository';

export class CreateCommentCommand {
  constructor(
    public dto: CreateCommentDto,
    public userId: string,
    public postId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    @InjectModel(Comment.name)
    private commentModel: CommentModelType,
    private postsRepository: PostRepository,
    private commentRepository: CommentRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}
  async execute({
    dto,
    userId,
    postId,
  }: CreateCommentCommand): Promise<string> {
    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
        field: 'user',
      });
    }

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'post',
      });
    }

    const newComment = this.commentModel.createComment(
      dto,
      postId,
      userId,
      user.login,
    );

    await this.commentRepository.save(newComment);
    return newComment._id.toString();
  }
}
