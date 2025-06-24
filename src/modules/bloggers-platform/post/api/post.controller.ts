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
import { PostRepository } from '../infrastructure/post.repository';
import { PostService } from '../application/post.service';
import { CreatePostDto } from './input-dto/post.input-dto';
import { PostQueryRepository } from '../infrastructure/query/post.query-repository';
import { UpdatePostDto } from './input-dto/updats-post.input-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';

@Controller('posts')
export class PostController {
  constructor(
    private postRepository: PostRepository,
    private postService: PostService,
    private postQueryRepository: PostQueryRepository,
  ) {}

  @Post()
  async createPost(@Body() postDto: CreatePostDto) {
    const postId = await this.postService.createPost(postDto);
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(@Param('id') postId: string, @Body() dto: UpdatePostDto) {
    await this.postService.updateBlog(postId, dto);
  }

  @Get(':id')
  async getPost(@Param('id') postId: string) {
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get()
  async getAll(@Query() query: GetPostQueryParams) {
    return this.postQueryRepository.getAll(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') postId: string) {
    await this.postService.deletePost(postId);
  }
}
