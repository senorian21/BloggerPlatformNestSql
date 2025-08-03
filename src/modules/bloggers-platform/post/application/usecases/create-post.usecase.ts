import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CreatePostDto } from '../../api/input-dto/post.input-dto';
import { BlogsRepository } from '../../../blog/infrastructure/blog.repository';
import { PostRepository } from '../../infrastructure/post.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreatePostCommand {
  constructor(
    public dto: CreatePostDto,
    public blogId?: number,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, number>
{
  constructor(
    private postsRepository: PostRepository,
    private blogsRepository: BlogsRepository,
  ) {}
  async execute({ dto, blogId }: CreatePostCommand): Promise<number> {
    if (blogId) {
      dto.blogId = blogId;
    }
    const blog = await this.blogsRepository.findById(dto.blogId);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found.',
      });
    }

    const postId = await this.postsRepository.createPost(dto, blog.name)
    return postId;
  }
}
