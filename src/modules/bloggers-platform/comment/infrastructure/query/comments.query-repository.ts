import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { FilterQuery, Types } from 'mongoose';
import { likeStatus } from '../../../post/domain/dto/like-status.domain.dto';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { plainToClass } from 'class-transformer';
import { GetCommentQueryParams } from '../../api/input-dto/get-comment-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentRepository } from '../comment.repository';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: CommentModelType,
    private commentRepository: CommentRepository,
  ) {}
  async getByIdOrNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<CommentViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comments not found',
      });
    }
    const comment = await this.commentModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comments not found',
      });
    }

    let myStatus: likeStatus = likeStatus.None;

    if (userId) {
      const userLike = await this.commentRepository.findLikeByIdUser(
        userId,
        id,
      );

      if (userLike) {
        myStatus = userLike.status as likeStatus;
      }
    }

    return CommentViewDto.mapToView(comment, myStatus);
  }

  async getAll(
    query: GetCommentQueryParams,
    postId: string,
    userId?: string,
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

    let myStatusArray: likeStatus[] = Array.from(
      { length: rawComments.length },
      () => likeStatus.None,
    );

    if (userId) {
      myStatusArray = await Promise.all(
        rawComments.map(async (comment) => {
          const userLike = await this.commentRepository.findLikeByIdUser(
            userId,
            comment._id.toString(),
          );
          return userLike?.status ?? likeStatus.None;
        }),
      );
    }

    const items = rawComments.map((comment, index) =>
      CommentViewDto.mapToView(comment, myStatusArray[index]),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: queryParams.pageNumber,
      size: queryParams.pageSize,
    });
  }
}
