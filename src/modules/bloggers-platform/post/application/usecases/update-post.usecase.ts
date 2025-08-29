import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { BlogsRepository } from '../../../blog/infrastructure/blog.repository';
import { PostRepository } from '../../infrastructure/post.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePostDto } from '../../dto/create-post.dto';

export class UpdatePostCommand {
  constructor(
    public dto: UpdatePostDto,
    public postId: number,
    public blogId: number,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(
    private postsRepository: PostRepository,
    private blogsRepository: BlogsRepository,
  ) {}
  async execute({ dto, postId, blogId }: UpdatePostCommand): Promise<void> {
    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found.',
      });
    }
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found.',
      });
    }

    if (post.blogId !== blogId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Post does not belong to this blog',
      });
    }

    post.update(dto, blog.id);
    await this.postsRepository.save(post);
  }
}
