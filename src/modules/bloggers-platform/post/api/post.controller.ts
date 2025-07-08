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
import { CreatePostDto } from './input-dto/post.input-dto';
import { PostQueryRepository } from '../infrastructure/query/post.query-repository';
import { UpdatePostDto } from './input-dto/updats-post.input-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { CommentsQueryRepository } from '../../comment/infrastructure/query/comments.query-repository';
import { GetCommentQueryParams } from '../../comment/api/input-dto/get-comment-query-params.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { GetPostByIdQuery } from '../application/queries/get-post-by-id.query-handler';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetAllPostQuery } from '../application/queries/get-all-post.query-handler';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

@Controller('posts')
export class PostController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createPost(@Body() postDto: CreatePostDto) {
    const postId = await this.commandBus.execute<CreatePostCommand, string>(
      new CreatePostCommand(postDto),
    );
    return this.queryBus.execute<GetPostByIdQuery, PostViewDto>(
      new GetPostByIdQuery(postId),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(@Param('id') postId: string, @Body() dto: UpdatePostDto) {
    await this.commandBus.execute<UpdatePostCommand, void>(
      new UpdatePostCommand(dto, postId),
    );
  }

  @Get(':id')
  async getPost(@Param('id') postId: string) {
    return this.queryBus.execute<GetPostByIdQuery, PostViewDto>(
      new GetPostByIdQuery(postId),
    );
  }

  @Get()
  async getAll(@Query() query: GetPostQueryParams) {
    return this.queryBus.execute<
      GetAllPostQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetAllPostQuery(query));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') postId: string) {
    await this.commandBus.execute(new DeletePostCommand(postId));
  }

  @Get(':id/comments')
  async getCommentByPost(
    @Query() query: GetCommentQueryParams,
    @Param('id') postId: string,
  ) {
    return this.commentsQueryRepository.getAll(query, postId);
  }
}
