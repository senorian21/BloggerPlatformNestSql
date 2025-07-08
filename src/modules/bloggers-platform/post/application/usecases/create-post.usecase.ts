import { InjectModel } from '@nestjs/mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CreatePostDto } from '../../api/input-dto/post.input-dto';
import { BlogsRepository } from '../../../blog/infrastructure/blog.repository';
import { PostRepository } from '../../infrastructure/post.repository';
import { Post, PostModelType } from '../../domain/post.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreatePostCommand {
  constructor(
    public dto: CreatePostDto,
    public blogId?: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    @InjectModel(Post.name)
    private postModel: PostModelType,
    private postsRepository: PostRepository,
    private blogsRepository: BlogsRepository,
  ) {}
  async execute({ dto, blogId }: CreatePostCommand): Promise<string> {
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
    const post = this.postModel.createInstance(dto, blog.name);
    await this.postsRepository.save(post);
    return post._id.toString();
  }
}
