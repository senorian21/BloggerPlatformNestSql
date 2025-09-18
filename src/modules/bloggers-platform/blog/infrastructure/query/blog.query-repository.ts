import { Injectable } from '@nestjs/common';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blog-query-params.input-dto';
import { plainToClass } from 'class-transformer';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Blog } from '../../domain/blog.entity';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
  ) {}

  async getByIdOrNotFoundFail(id: number): Promise<QuestionViewDto> {
    const blog = await this.blogRepository
      .createQueryBuilder('b')
      .select([
        'b.id::text AS id',
        'b.name AS name',
        'b.description AS description',
        'b.websiteUrl AS "websiteUrl"',
        'b.createdAt AS "createdAt"',
        'b.isMembership AS "isMembership"',
      ])
      .where('b.id = :id', { id })
      .andWhere('b.deletedAt IS NULL')
      .getRawOne<QuestionViewDto>();

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'BLOG_NOT_FOUND',
      });
    }

    return blog;
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const queryParams = plainToClass(GetBlogsQueryParams, query);

    const pageNumber = Math.max(1, Number(queryParams.pageNumber) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(queryParams.pageSize) || 10),
    );
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = ['name', 'createdAt'] as const;
    const sortBy = allowedSortFields.includes(queryParams.sortBy as any)
      ? (queryParams.sortBy as (typeof allowedSortFields)[number])
      : 'createdAt';
    const sortDirection: 'ASC' | 'DESC' =
      queryParams.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const searchName = queryParams.searchNameTerm?.trim();

    const qb = this.blogRepository
      .createQueryBuilder('b')
      .select([
        'b.id::text AS id',
        'b.name AS name',
        'b.description AS description',
        'b.websiteUrl AS "websiteUrl"',
        'b.createdAt AS "createdAt"',
        'b.isMembership AS "isMembership"',
      ])
      .where('b.deletedAt IS NULL');

    if (searchName) {
      qb.andWhere(
        new Brackets((qb1) => {
          qb1.where('LOWER(b.name) LIKE LOWER(:name)', {
            name: `%${searchName}%`,
          });
        }),
      );
    }

    qb.orderBy(`b.${sortBy}`, sortDirection).skip(skip).take(pageSize);

    const blogs = await qb.getRawMany<QuestionViewDto>();

    const countQb = this.blogRepository
      .createQueryBuilder('b')
      .where('b.deletedAt IS NULL');

    if (searchName) {
      countQb.andWhere(
        new Brackets((qb1) => {
          qb1.where('LOWER(b.name) LIKE LOWER(:name)', {
            name: `%${searchName}%`,
          });
        }),
      );
    }

    const totalCount = await countQb.getCount();

    return PaginatedViewDto.mapToView({
      items: blogs,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
