import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { FilterQuery, Types } from 'mongoose';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blog-query-params.input-dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Blog not found.');
    }
    const blog = await this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!blog) {
      throw new NotFoundException('Blog not found.');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const queryParams = plainToClass(GetBlogsQueryParams, query);

    const filter: FilterQuery<Blog> = {
      deletedAt: null,
    };

    if (queryParams.searchNameTerm) {
      filter.name = { $regex: queryParams.searchNameTerm, $options: 'i' };
    }

    const blogs = await this.BlogModel.find(filter)
      .sort({ [queryParams.sortBy]: queryParams.sortDirection })
      .skip(queryParams.calculateSkip())
      .limit(queryParams.pageSize);

    const totalCount = await this.BlogModel.countDocuments(filter);

    const items = blogs.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: queryParams.pageNumber,
      size: queryParams.pageSize,
    });
  }
}
