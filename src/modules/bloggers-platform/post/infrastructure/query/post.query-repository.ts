import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { FilterQuery, Types } from 'mongoose';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { likeStatus } from '../../domain/dto/like-status.domain.dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { plainToClass } from 'class-transformer';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { BlogQueryRepository } from '../../../blog/infrastructure/query/blog.query-repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { PostRepository } from '../post.repository';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogQueryRepository: BlogQueryRepository,
    private postsRepository: PostRepository,
  ) {}
  async getByIdOrNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<PostViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    let myStatus: likeStatus = likeStatus.None;
    if (userId) {
      const userLike = await this.postsRepository.findLikeByIdUser(userId, id);
      if (userLike) {
        myStatus = userLike.status;
      }
    }

    return PostViewDto.mapToView(post, myStatus);
  }

  async getAll(
    query: GetPostQueryParams,
    blogId?: string,
    userId?: string | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = plainToClass(GetPostQueryParams, query);

    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    if (blogId) {
      await this.blogQueryRepository.getByIdOrNotFoundFail(+blogId);
      filter.blogId = blogId;
    }

    const rawPosts = await this.PostModel.find(filter)
      .sort({ [queryParams.sortBy]: queryParams.sortDirection })
      .skip(queryParams.calculateSkip())
      .limit(queryParams.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    let myStatusArray = Array(rawPosts.length).fill(likeStatus.None);
    if (userId) {
      myStatusArray = await Promise.all(
        rawPosts.map(async (post) => {
          const postId = post._id.toString();
          const userLike = await this.postsRepository.findLikeByIdUser(
            userId,
            postId,
          );
          return userLike?.status ?? likeStatus.None;
        }),
      );
    }

    const items = rawPosts.map((post, index) =>
      PostViewDto.mapToView(post, myStatusArray[index]),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: queryParams.pageNumber,
      size: queryParams.pageSize,
    });
  }
}
