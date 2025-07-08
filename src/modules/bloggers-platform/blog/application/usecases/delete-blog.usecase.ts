import { BlogsRepository } from '../../infrastructure/blog.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteBlogCommand {
  constructor(public blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private blogsRepository: BlogsRepository) {}

  async execute({ blogId }: DeleteBlogCommand): Promise<void> {
    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
      });
    }
    blog.softDeleteBlog();
    await this.blogsRepository.save(blog);
  }
}
