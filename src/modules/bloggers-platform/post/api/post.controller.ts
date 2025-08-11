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
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';

@Controller('posts')
export class PostController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getPost(
    @Param('id') postId: number,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    const userId = user?.id;
    return this.queryBus.execute<GetPostByIdQuery, PostViewDto>(
      new GetPostByIdQuery(postId, userId),
    );
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getAll(
    @Query() query: GetPostQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    const userId = user?.id;
    return this.queryBus.execute<
      GetAllPostQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetAllPostQuery(query, undefined, userId));
  }

  @Get('/:id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentByPost(
    @Query() query: GetCommentQueryParams,
    @Param('id') postId: number,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    const userId = user?.id;
    return this.queryBus.execute<
      GetAllCommentsQuery,
      PaginatedViewDto<CommentViewDto[]>
    >(new GetAllCommentsQuery(query, postId, userId));
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id') postId: number,
    @Body() dto: CreateCommentDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    const commentId = await this.commandBus.execute<
      CreateCommentCommand,
      number
    >(new CreateCommentCommand(dto, user.id, postId));
    return this.queryBus.execute<GetCommentsByIdQuery, CommentViewDto>(
      new GetCommentsByIdQuery(commentId),
    );
  }

  //
  // @Put(':id/like-status')
  // @UseGuards(JwtAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async likeStatus(
  //   @Param('id') postId: string,
  //   @ExtractUserFromRequest() user: UserContextDto,
  //   @Body() dto: LikeStatusInputDto,
  // ) {
  //   await this.commandBus.execute<LikeStatusPostCommand, void>(
  //     new LikeStatusPostCommand(postId, user.id.toString(), dto.likeStatus),
  //   );
  // }
}
