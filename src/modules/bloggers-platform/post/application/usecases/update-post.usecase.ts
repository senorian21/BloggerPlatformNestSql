import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CreatePostDto } from '../../api/input-dto/post.input-dto';
import { BlogsRepository } from '../../../blog/infrastructure/blog.repository';
import { PostRepository } from '../../infrastructure/post.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdatePostCommand {
  constructor(
    public dto: CreatePostDto,
    public postId: string,
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
  async execute({ dto, postId }: UpdatePostCommand): Promise<void> {
    const blog = await this.blogsRepository.findById(dto.blogId);
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
    post.updatePost(dto, blog.name);
    await this.postsRepository.save(post);
  }
}
