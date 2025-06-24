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
import { PostService } from '../application/post.service';
import { CreatePostDto } from './input-dto/post.input-dto';
import { PostQueryRepository } from '../infrastructure/query/post.query-repository';
import { UpdatePostDto } from './input-dto/updats-post.input-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { CommentsQueryRepository } from '../../comment/infrastructure/query/comments.query-repository';
import { GetCommentQueryParams } from '../../comment/api/input-dto/get-comment-query-params.input-dto';

@Controller('posts')
export class PostController {
  constructor(
    private postService: PostService,
    private postQueryRepository: PostQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
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

  @Get(':id/comments')
  async getCommentByPost(
    @Query() query: GetCommentQueryParams,
    @Param('id') postId: string,
  ) {
    return this.commentsQueryRepository.getAll(query, postId);
  }
}
