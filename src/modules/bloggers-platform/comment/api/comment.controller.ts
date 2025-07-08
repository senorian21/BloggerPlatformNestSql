import { Controller, Get, Param } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { QueryBus } from '@nestjs/cqrs';
import { GetCommentsByIdQuery } from '../application/queries/get-comments-by-id.query-handler';
import { CommentViewDto } from './view-dto/comment.view-dto';

@Controller('comments')
export class CommentController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  async getCommentById(@Param('id') commentId: string) {
    return this.queryBus.execute<GetCommentsByIdQuery, CommentViewDto>(
      new GetCommentsByIdQuery(commentId),
    );
  }
}
