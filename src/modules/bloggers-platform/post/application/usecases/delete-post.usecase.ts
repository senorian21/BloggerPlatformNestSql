import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PostRepository } from '../../infrastructure/post.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../blog/infrastructure/blog.repository';

export class DeletePostCommand {
  constructor(
    public postId: number,
    public blogId: number,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(
    private postsRepository: PostRepository,
    private blogRepository: BlogsRepository,
  ) {}
  async execute({ postId, blogId }: DeletePostCommand): Promise<void> {
    const blog = await this.blogRepository.findById(blogId);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found.',
      });
    }

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found.',
      });
    }

    if (blog.id !== post.blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post does not belong to this blog',
      });
    }

    await this.postsRepository.softDeletePost(postId);
  }
}
