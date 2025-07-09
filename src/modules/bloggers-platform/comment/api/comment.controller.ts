import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCommentsByIdQuery } from '../application/queries/get-comments-by-id.query-handler';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/user.decorator';
import { UserContextDto } from '../../../user-accounts/auth/dto/user-context.dto';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';
import { UpdateCommentDto } from './input-dto/updats-comment.input-dto';
import { CommentLikeStatusInputDto } from './input-dto/comment-like-status.input-dto';
import { LikeStatusCommentCommand } from '../application/usecases/create-like-or-dislike-comment.usecase';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';

@Controller('comments')
export class CommentController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentById(
    @Param('id') commentId: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ) {
    return this.queryBus.execute<GetCommentsByIdQuery, CommentViewDto>(
      new GetCommentsByIdQuery(commentId, user.id.toString()),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteCommentById(
    @Param('id') commentId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    await this.commandBus.execute<DeleteCommentCommand, void>(
      new DeleteCommentCommand(commentId, user.id.toString()),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') commentId: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: UpdateCommentDto,
  ) {
    await this.commandBus.execute<UpdateCommentCommand, void>(
      new UpdateCommentCommand(commentId, user.id.toString(), dto),
    );
  }

  @Put(':id/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async likeStatus(
    @Param('id') commentId: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: CommentLikeStatusInputDto,
  ) {
    await this.commandBus.execute<LikeStatusCommentCommand, void>(
      new LikeStatusCommentCommand(
        commentId,
        user.id.toString(),
        dto.likeStatus,
      ),
    );
  }
}
