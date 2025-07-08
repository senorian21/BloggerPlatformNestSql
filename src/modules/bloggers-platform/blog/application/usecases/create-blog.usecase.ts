import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogsRepository } from '../../infrastructure/blog.repository';
import { CreateBlogDto } from '../../dto/create-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(
    @InjectModel(Blog.name)
    private blogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute({ dto }: CreateBlogCommand): Promise<string> {
    const blog = this.blogModel.createInstance(dto);
    await this.blogsRepository.save(blog);
    return blog._id.toString();
  }
}
