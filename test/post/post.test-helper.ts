import { INestApplication, HttpStatus } from '@nestjs/common';
import request, { Response } from 'supertest';
import {
  CreatePostDto,
  UpdatePostDto,
} from '../../src/modules/bloggers-platform/post/dto/create-post.dto';

export class PostsTestHelper {
  constructor(private app: INestApplication) {}

  async createPost(blogId: string, postData: CreatePostDto): Promise<Response> {
    const response = await request(this.app.getHttpServer())
      .post(`/api/sa/blogs/${blogId}/posts`)
      .auth('admin', 'qwerty')
      .send(postData)
      .expect(HttpStatus.CREATED);

    return response;
  }

  async updatePost(
    blogId: string,
    postId: string,
    postData: UpdatePostDto,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/api/sa/blogs/${blogId}/posts/${postId}`)
      .auth('admin', 'qwerty')
      .send(postData)
      .expect(HttpStatus.NO_CONTENT);
  }

  async deletePost(blogId: string, postId: string): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/api/sa/blogs/${blogId}/posts/${postId}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);
  }
}
