import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}
  async findById(blogId: string): Promise<BlogDocument | null> {
    const blog = this.BlogModel.findOne({
      _id: blogId,
      deletedAt: null,
    });
    return blog;
  }
  async save(blog: BlogDocument) {
    await blog.save();
  }
}
