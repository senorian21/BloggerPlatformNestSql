import { InjectModel } from '@nestjs/mongoose';
import { PostRepository } from '../../infrastructure/post.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { likeStatus } from '../../../like/domain/like-comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';


export class LikeStatusPostCommand {
  constructor(
    public postId: number,
    public userId: number,
    public likeStatusReq: likeStatus,
  ) {}
}

@CommandHandler(LikeStatusPostCommand)
export class LikeStatusPostUseCase
  implements ICommandHandler<LikeStatusPostCommand, void>
{
  constructor(
    private postsRepository: PostRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}
  async execute({
    postId,
    userId,
    likeStatusReq,
  }: LikeStatusPostCommand): Promise<void> {

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found.',
      });
    }

    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found.',
      });
    }

    const newLike = this.postsRepository.createLikePost(
      postId,
      userId,
      likeStatusReq,
      user.login,
    );
  }
}
