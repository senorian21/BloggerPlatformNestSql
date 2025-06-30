import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogService } from '../application/blog.service';
import { BlogQueryRepository } from '../infrastructure/query/blog.query-repository';
import { GetBlogsQueryParams } from './input-dto/get-blog-query-params.input-dto';
import { PostService } from '../../post/application/post.service';
import { PostQueryRepository } from '../../post/infrastructure/query/post.query-repository';
import { GetPostQueryParams } from '../../post/api/input-dto/get-post-query-params.input-dto';
import { CreatePostDto } from '../../post/api/input-dto/post.input-dto';
import { CreateBlogDto } from './input-dto/blog.input-dto';
import { UpdateBlogDto } from './input-dto/updats-blog.input-dto';

@Controller('blogs')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
    private postService: PostService,
    private postQueryRepository: PostQueryRepository,
  ) {}

  @Post()
  async createBlog(@Body() dto: CreateBlogDto) {
    const blogId = await this.blogService.createBlog(dto);
    return this.blogQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(@Param('id') blogId: string, @Body() dto: UpdateBlogDto) {
    await this.blogService.updateBlog(blogId, dto);
  }

  @Get(':id')
  async getBlogById(@Param('id') blogId: string) {
    return this.blogQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Get()
  async getAll(@Query() query: GetBlogsQueryParams) {
    return this.blogQueryRepository.getAll(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') blogId: string) {
    await this.blogService.deleteBlog(blogId);
  }

  @Get(':id/posts')
  async getPostByBlog(
    @Param('id') blogId: string,
    @Query() query: GetPostQueryParams,
  ) {
    return this.postQueryRepository.getAll(query, blogId);
  }

  @Post(':id/posts')
  async createPostByIdBlog(
    @Param('id') blogId: string,
    @Body() dto: CreatePostDto,
  ) {
    const postId = await this.postService.createPost(dto, blogId);
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }
}
