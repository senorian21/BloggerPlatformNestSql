import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { FilterQuery, Types } from 'mongoose';
import { likeStatus } from '../../../post/domain/dto/like-status.domain.dto';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { plainToClass } from 'class-transformer';
import { GetCommentQueryParams } from '../../api/input-dto/get-comment-query-params.input-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: CommentModelType,
  ) {}
  async getByIdOrNotFoundFail(id: string): Promise<CommentViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Comments not found.');
    }
    const comment = await this.commentModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!comment) {
      throw new NotFoundException('Comments not found.');
    }
    const myStatus: likeStatus = likeStatus.None;

    return CommentViewDto.mapToView(comment, myStatus);
  }
  async getAll(
    query: GetCommentQueryParams,
    postId: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const queryParams = plainToClass(GetCommentQueryParams, query);

    const filter: FilterQuery<Comment> = {
      deletedAt: null,
      postId: postId,
    };

    const rawComments = await this.commentModel
      .find(filter)
      .sort({ [queryParams.sortBy]: queryParams.sortDirection })
      .skip(queryParams.calculateSkip())
      .limit(queryParams.pageSize);

    const totalCount = await this.commentModel.countDocuments(filter);

    const myStatusArray = Array(rawComments.length).fill(likeStatus.None);

    const items = rawComments.map((comments, index) =>
      CommentViewDto.mapToView(comments, myStatusArray[index]),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: queryParams.pageNumber,
      size: queryParams.pageSize,
    });
  }
}
