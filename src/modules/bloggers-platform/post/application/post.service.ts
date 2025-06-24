import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostRepository } from '../infrastructure/post.repository';
import { Post, PostModelType } from '../domain/post.entity';
import { CreatePostDto } from '../api/input-dto/post.input-dto';
import { BlogsRepository } from '../../blog/infrastructure/blog.repository';
import { UpdatePostDto } from '../api/input-dto/updats-post.input-dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private postModel: PostModelType,
    private postsRepository: PostRepository,
    private blogsRepository: BlogsRepository,
  ) {}
  async createPost(dto: CreatePostDto, blogId?: string) {
    if (blogId) {
      dto.blogId = blogId;
    }
    const blog = await this.blogsRepository.findById(dto.blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const post = this.postModel.createInstance(dto, blog.name);
    await this.postsRepository.save(post);
    return post._id.toString();
  }
  async updateBlog(postId: string, dto: UpdatePostDto) {
    const blog = await this.blogsRepository.findById(dto.blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    post.updatePost(dto, blog.name);
    await this.postsRepository.save(post);
  }
  async deletePost(postId: string) {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    post.deletePost();
    await this.postsRepository.save(post);
  }
}
