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
  UseGuards,
} from '@nestjs/common';
import { CreatePostDto } from './input-dto/post.input-dto';
import { UpdatePostDto } from './input-dto/updats-post.input-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { GetCommentQueryParams } from '../../comment/api/input-dto/get-comment-query-params.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { GetPostByIdQuery } from '../application/queries/get-post-by-id.query-handler';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetAllPostQuery } from '../application/queries/get-all-post.query-handler';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetAllCommentsQuery } from '../../comment/application/queries/get-all-comments.query-handler';
import { CommentViewDto } from '../../comment/api/view-dto/comment.view-dto';
import { CreateCommentDto } from './input-dto/create-comment.input-dto';
import { UserContextDto } from '../../../user-accounts/auth/dto/user-context.dto';
import { CreateCommentCommand } from '../application/usecases/create-comment.usecase';
import { GetCommentsByIdQuery } from '../../comment/application/queries/get-comments-by-id.query-handler';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/user.decorator';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { LikeStatusPostCommand } from '../application/usecases/post-like-status.usecase';
import { LikeStatusInputDto } from './input-dto/like-status-post.input-dto';

@Controller('posts')
export class PostController {
  constructor(
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
  @UseGuards(JwtOptionalAuthGuard)
  async getPost(
    @Param('id') postId: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    const userId = user?.id?.toString();
    return this.queryBus.execute<GetPostByIdQuery, PostViewDto>(
      new GetPostByIdQuery(postId, userId),
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
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentByPost(
    @Query() query: GetCommentQueryParams,
    @Param('id') postId: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ) {
    return this.queryBus.execute<
      GetAllCommentsQuery,
      PaginatedViewDto<CommentViewDto[]>
    >(new GetAllCommentsQuery(query, postId, user.id.toString()));
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    const commentId = await this.commandBus.execute<
      CreateCommentCommand,
      string
    >(new CreateCommentCommand(dto, user.id.toString(), postId));
    return this.queryBus.execute<GetCommentsByIdQuery, CommentViewDto>(
      new GetCommentsByIdQuery(commentId),
    );
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @Param('id') postId: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: LikeStatusInputDto,
  ) {
    await this.commandBus.execute<LikeStatusPostCommand, void>(
      new LikeStatusPostCommand(postId, user.id.toString(), dto.likeStatus),
    );
  }
}
