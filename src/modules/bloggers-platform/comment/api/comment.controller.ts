import { Controller, Get, Param } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';

@Controller('comments')
export class CommentController {
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  @Get(':id')
  async getCommentById(@Param('id') commentId: string) {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(commentId);
  }
}
