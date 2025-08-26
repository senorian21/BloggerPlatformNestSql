import { BlogsRepository } from '../../infrastructure/blog.repository';
import { CreateBlogDto } from '../../dto/create-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {Blog} from "../../domain/blog.entity";

export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, number>
{
  constructor(private blogsRepository: BlogsRepository) {}

  async execute({ dto }: CreateBlogCommand): Promise<number> {
    const blog = Blog.create(dto)
    await this.blogsRepository.save(blog);
    return blog.id;
  }
}
