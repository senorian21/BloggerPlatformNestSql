import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { FilterQuery, Types } from 'mongoose';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { likeStatus } from '../../domain/dto/like-status.domain.dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { plainToClass } from 'class-transformer';
import { Blog } from '../../../blog/domain/blog.entity';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { BlogQueryRepository } from '../../../blog/infrastructure/query/blog.query-repository';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogQueryRepository: BlogQueryRepository,
  ) {}
  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Blog not found.');
    }
    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!post) {
      throw new NotFoundException('Blog not found.');
    }
    const myStatus: likeStatus = likeStatus.None;

    return PostViewDto.mapToView(post, myStatus);
  }

  async getAll(
    query: GetPostQueryParams,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = plainToClass(GetPostQueryParams, query);

    const filter: FilterQuery<Blog> = {
      deletedAt: null,
    };

    if (blogId) {
      await this.blogQueryRepository.getByIdOrNotFoundFail(blogId);
      filter.blogId = blogId;
    }

    const rawPosts = await this.PostModel.find(filter)
      .sort({ [queryParams.sortBy]: queryParams.sortDirection })
      .skip(queryParams.calculateSkip())
      .limit(queryParams.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const myStatusArray = Array(rawPosts.length).fill(likeStatus.None);

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
