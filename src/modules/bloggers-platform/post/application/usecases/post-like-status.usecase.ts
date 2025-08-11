import { InjectModel } from '@nestjs/mongoose';
import { PostRepository } from '../../infrastructure/post.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { likeStatus } from '../../../like/domain/like=comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import {
  LikePost,
  likePostModelType,
} from '../../../like/domain/like-post.entity';

export class LikeStatusPostCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatusReq: likeStatus,
  ) {}
}

@CommandHandler(LikeStatusPostCommand)
export class LikeStatusPostUseCase
  implements ICommandHandler<LikeStatusPostCommand, void>
{
  constructor(
    @InjectModel(LikePost.name)
    private likePostModel: likePostModelType,
    private postsRepository: PostRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}
  async execute({
    postId,
    userId,
    likeStatusReq,
  }: LikeStatusPostCommand): Promise<void> {
    const post = await this.postsRepository.findById(+postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found.',
      });
    }

    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(+userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found.',
      });
    }

    // const like = await this.postsRepository.findLikeByIdUser(userId, postId);
    // const previousStatus = like?.status || likeStatus.None;
    //
    // if (!like) {
    //   const newLike = this.likePostModel.createLikePost(
    //     postId,
    //     userId,
    //     likeStatusReq,
    //   );
    //
    //   await this.postsRepository.saveLike(newLike);
    //
    //   post.setLikeStatus(userId, user.login, likeStatusReq, previousStatus);
    // } else {
    //   like.updateLikePost(likeStatusReq);
    //
    //   await this.postsRepository.saveLike(like);
    //
    //   post.setLikeStatus(userId, user.login, likeStatusReq, previousStatus);
    // }
    //
    // await this.postsRepository.save(post);
  }
}
