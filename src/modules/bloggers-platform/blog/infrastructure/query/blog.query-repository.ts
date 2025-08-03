import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { FilterQuery, Types } from 'mongoose';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blog-query-params.input-dto';
import { plainToClass } from 'class-transformer';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,

    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getByIdOrNotFoundFail(id: number): Promise<BlogViewDto> {
    const blog = await this.dataSource.query(
      `
      SELECT 
         id::text as id,
         name,
         description,
         "websiteUrl",
         "createdAt",
         "isMembership"
      FROM "Blog"
      WHERE id = $1 and 
        "deletedAt" IS NULL`,
      [id],
    );

    if (blog.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'BLOG NOT_FOUND',
      });
    }

    return blog[0];
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const queryParams = plainToClass(GetBlogsQueryParams, query);

    const pageNumber = Math.max(1, Number(queryParams.pageNumber) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(queryParams.pageSize) || 10),
    );
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = [
      'name',
      'createdAt'
    ];
    const sortBy = allowedSortFields.includes(queryParams.sortBy)
      ? queryParams.sortBy
      : 'createdAt';

    const filter: FilterQuery<Blog> = {
      deletedAt: null,
    };

    const sortDirection = queryParams.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const baseConditions = [`"deletedAt" IS NULL`];
    const searchConditions: string[] = [];
    const params: any[] = [];

    if (queryParams.searchNameTerm?.trim()) {
      searchConditions.push(`LOWER(name) LIKE LOWER($${params.length + 1})`);
      params.push(`%${queryParams.searchNameTerm.trim()}%`);
    }

    let whereClause = baseConditions.join(' AND ');

    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(' OR ')})`;
    }

    const dataQuery = `
    SELECT 
      id :: text as id,
      name,
      description,
      "websiteUrl",
      "createdAt",
      "isMembership"
    FROM "Blog"
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;


    params.push(pageSize, skip);

    const blogs = await this.dataSource.query(dataQuery, params);

    const countQuery = `
    SELECT COUNT(*)::int AS total_count 
    FROM "Blog" 
    ${whereClause ? `WHERE ${whereClause}` : ''}
  `;
    const countResult = await this.dataSource.query(
      countQuery,
      params.slice(0, -2),
    );
    const totalCount = countResult[0]?.total_count || 0;
    return PaginatedViewDto.mapToView({
      items: blogs,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
