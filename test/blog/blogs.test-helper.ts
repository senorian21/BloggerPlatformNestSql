import { INestApplication, HttpStatus } from '@nestjs/common';
import request, { Response } from 'supertest';
import {
  CreateBlogDto,
  UpdateBlogDto,
} from '../../src/modules/bloggers-platform/blog/dto/create-blog.dto';

export class BlogsTestHelper {
  constructor(private app: INestApplication) {}

  async createBlog(blogData: CreateBlogDto): Promise<Response> {
    const response = await request(this.app.getHttpServer())
      .post('/api/sa/blogs')
      .auth('admin', 'qwerty')
      .send(blogData)
      .expect(HttpStatus.CREATED);

    return response;
  }

  async updateBlog(blogId: string, blogData: UpdateBlogDto): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/api/sa/blogs/${blogId}`)
      .auth('admin', 'qwerty')
      .send(blogData)
      .expect(HttpStatus.NO_CONTENT);
  }

  async deleteBlog(blogId: string): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/api/sa/blogs/${blogId}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);
  }
}
