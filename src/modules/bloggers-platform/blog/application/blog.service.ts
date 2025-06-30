import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { BlogsRepository } from '../infrastructure/blog.repository';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private blogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}
  async createBlog(dto: CreateBlogDto) {
    const blog = this.blogModel.createInstance(dto);
    await this.blogsRepository.save(blog);
    return blog._id.toString();
  }
  async updateBlog(blogId: string, dto: UpdateBlogDto) {
    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
      });
    }
    blog.updateBlog(dto);
    await this.blogsRepository.save(blog);
  }
  async deleteBlog(blogId: string) {
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
