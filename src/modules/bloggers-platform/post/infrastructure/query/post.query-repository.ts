import { Injectable } from '@nestjs/common';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}
  async getByIdOrNotFoundFail(
    id: number,
    userId?: number,
  ): Promise<PostViewDto> {
    const params = [id, userId ?? null];

    const [post] = await this.dataSource.query(
      `
    SELECT 
      p.id::TEXT AS "id",
      p.title,
      p."shortDescription",
      p.content,
      p."blogId"::TEXT AS "blogId",
      p."blogName",
      p."createdAt",
      json_build_object(
        'likesCount', p."likeCount",
        'dislikesCount', p."dislikeCount",
        'myStatus', 
        CASE 
          WHEN $2::INTEGER IS NOT NULL THEN COALESCE(
            (SELECT INITCAP(status) 
             FROM "PostLike" 
             WHERE "postId" = p.id 
               AND "userId" = $2::INTEGER),
            'None'
          )
          ELSE 'None'
        END,
        'newestLikes', COALESCE(
          (
            SELECT jsonb_agg(jsonb_build_object(
              'addedAt', nl."addedAt",
              'userId', nl.userid::TEXT,
              'login', nl.login
            ) ORDER BY nl."addedAt" DESC)
            FROM (
              SELECT nl."addedAt", nl.userid, nl.login
              FROM "newestLikes" nl
              WHERE nl."postId" = p.id
              ORDER BY nl."addedAt" DESC
              LIMIT 3
            ) AS nl
          ),
          '[]'::jsonb
        )
      ) AS "extendedLikesInfo"
    FROM "Post" p
    WHERE 
      p.id = $1 
      AND p."deletedAt" IS NULL
  `,
      params,
    );

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

    const baseConditions = [`p."deletedAt" IS NULL`];

    const params: any[] = [];
    let paramIndex = 1;

    if (blogId !== undefined) {
      baseConditions.push(`p."blogId" = $${paramIndex}`);
      params.push(blogId);
      paramIndex++;
    }

    const whereClause = baseConditions.join(' AND ');

    const dataQuery = `
    SELECT 
      p.id::TEXT AS "id",
      p.title,
      p."shortDescription",
      p.content,
      p."blogId"::TEXT AS "blogId",
      p."blogName",
      p."createdAt",
      json_build_object(
        'likesCount', p."likeCount",
        'dislikesCount', p."dislikeCount",
        'myStatus', 
        CASE 
          WHEN $${paramIndex}::INTEGER IS NOT NULL THEN COALESCE(
            (SELECT INITCAP(pl.status)
             FROM "PostLike" pl
             WHERE pl."postId" = p.id
               AND pl."userId" = $${paramIndex}::INTEGER),
            'None'
          )
          ELSE 'None'
        END,
        'newestLikes', COALESCE(
          (
            SELECT jsonb_agg(jsonb_build_object(
                     'addedAt', sub."addedAt",
                     'userId',  sub.userid::TEXT,
                     'login',   sub.login
                   ) ORDER BY sub."addedAt" DESC)
            FROM (
              SELECT nl."addedAt", nl.userid, nl.login
              FROM "newestLikes" nl
              WHERE nl."postId" = p.id
              ORDER BY nl."addedAt" DESC
              LIMIT 3
            ) AS sub
          ),
          '[]'::jsonb
        )
      ) AS "extendedLikesInfo"
    FROM "Post" p
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY p."${sortBy}" ${sortDirection}
    LIMIT $${paramIndex + 1}
    OFFSET $${paramIndex + 2}
  `;

    // userId параметр для myStatus
    params.push(userId ?? null);
    // пагинация
    params.push(pageSize, skip);

    const posts = await this.dataSource.query(dataQuery, params);

    const countQuery = `
    SELECT COUNT(*)::int AS total_count 
    FROM "Post" p
    ${whereClause ? `WHERE ${whereClause}` : ''}
  `;
    const countParams = blogId !== undefined ? [blogId] : [];
    const countResult = await this.dataSource.query(countQuery, countParams);

    const totalCount = countResult[0]?.total_count || 0;

    return PaginatedViewDto.mapToView({
      items: posts,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
