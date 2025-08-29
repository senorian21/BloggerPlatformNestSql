import { Injectable } from '@nestjs/common';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from '../../domain/post.entity';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}
  async getByIdOrNotFoundFail(
    id: number,
    userId?: number,
  ): Promise<PostViewDto> {
    const qb = this.postRepository
      .createQueryBuilder('p')
      .innerJoin('Blog', 'b', 'b.id = p."blogId"')
      .select([
        `p.id::TEXT AS "id"`,
        `p.title AS title`,
        `p."shortDescription" AS "shortDescription"`,
        `p.content AS content`,
        `p."blogId"::TEXT AS "blogId"`,
        `b.name AS "blogName"`,
        `p."createdAt" AS "createdAt"`,
      ])
      .addSelect(
        `
      json_build_object(
        'likesCount', p."likeCount",
        'dislikesCount', p."dislikeCount",
        'myStatus', 
          CASE 
            WHEN :userId::INTEGER IS NOT NULL THEN COALESCE(
              (SELECT INITCAP(pl.status) 
               FROM "postLike" pl
               WHERE pl."postId" = p.id 
                 AND pl."userId" = :userId::INTEGER),
              'None'
            )
            ELSE 'None'
          END,
        'newestLikes', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'addedAt', nl."addedAt",
                'userId', nl."userId"::TEXT,
                'login', u.login
              )
              ORDER BY nl."addedAt" DESC
            )
            FROM (
              SELECT nl."addedAt", nl."userId"
              FROM "newestLikes" nl
              WHERE nl."postId" = p.id
              ORDER BY nl."addedAt" DESC
              LIMIT 3
            ) AS nl
            JOIN "users" u ON u.id = nl."userId"
          ),
          '[]'::jsonb
        )
      )
      `,
        'extendedLikesInfo',
      )
      .where('p.id = :id', { id })
      .andWhere('p."deletedAt" IS NULL')
      .setParameter('userId', userId ?? null);

    const post = await qb.getRawOne<PostViewDto>();

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return post;
  }

  async getAllPosts(
    query: GetPostQueryParams,
    blogId?: number,
    userId?: number | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const pageNumber = Math.max(1, Number(query.pageNumber) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = ['createdAt', 'blogName', 'title'];
    const sortBy = allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const qb = this.postRepository
      .createQueryBuilder('p')
      .innerJoin('Blog', 'b', 'b.id = p."blogId"')
      .select([
        `p.id::TEXT AS "id"`,
        `p.title AS title`,
        `p."shortDescription" AS "shortDescription"`,
        `p.content AS content`,
        `p."blogId"::TEXT AS "blogId"`,
        `b.name AS "blogName"`,
        `p."createdAt" AS "createdAt"`,
      ])
      .addSelect(
        `
      json_build_object(
        'likesCount', p."likeCount",
        'dislikesCount', p."dislikeCount",
        'myStatus', 
          CASE 
            WHEN :userId::INTEGER IS NOT NULL THEN COALESCE(
              (SELECT INITCAP(pl.status) 
               FROM "postLike" pl
               WHERE pl."postId" = p.id 
                 AND pl."userId" = :userId::INTEGER),
              'None'
            )
            ELSE 'None'
          END,
        'newestLikes', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'addedAt', nl."addedAt",
                'userId', nl."userId"::TEXT,
                'login', u.login
              )
              ORDER BY nl."addedAt" DESC
            )
            FROM (
              SELECT nl."addedAt", nl."userId"
              FROM "newestLikes" nl
              WHERE nl."postId" = p.id
              ORDER BY nl."addedAt" DESC
              LIMIT 3
            ) AS nl
            JOIN "users" u ON u.id = nl."userId"
          ),
          '[]'::jsonb
        )
      )
      `,
        'extendedLikesInfo',
      )
      .where('p."deletedAt" IS NULL')
      .setParameter('userId', userId ?? null);

    if (blogId !== undefined) {
      qb.andWhere('p."blogId" = :blogId', { blogId });
    }

    if (sortBy === 'blogName') {
      qb.orderBy('b.name', sortDirection as 'ASC' | 'DESC');
    } else {
      qb.orderBy(`p."${sortBy}"`, sortDirection as 'ASC' | 'DESC');
    }

    qb.limit(pageSize).offset(skip);

    const items = await qb.getRawMany<PostViewDto>();

    const countQb = this.postRepository
      .createQueryBuilder('p')
      .where('p."deletedAt" IS NULL');

    if (blogId !== undefined) {
      countQb.andWhere('p."blogId" = :blogId', { blogId });
    }

    const totalCount = await countQb.getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }
}
