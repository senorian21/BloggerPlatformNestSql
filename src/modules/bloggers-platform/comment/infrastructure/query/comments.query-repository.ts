import { Injectable } from '@nestjs/common';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetCommentQueryParams } from '../../api/input-dto/get-comment-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}
  async getByIdOrNotFoundFail(
      id: number,
      userId?: number,
  ): Promise<CommentViewDto> {
    const params = [id, userId ?? null];

    const [comment] = await this.dataSource.query(
        `
    SELECT 
      c.id::TEXT AS "id",
      c.content,
      json_build_object(
        'userId', c."userId"::TEXT,
        'userLogin', c."userLogin"
      ) AS "commentatorInfo",
      c."createdAt",
      json_build_object(
        'likesCount', c."likesCount",
        'dislikesCount', c."dislikesCount",
        'myStatus', COALESCE(
          (SELECT INITCAP(cl.status)
           FROM "CommentLike" cl
           WHERE cl."commentId" = c.id
             AND cl."userId" = $2
             AND $2 IS NOT NULL
           ORDER BY cl."addedAt" DESC
           LIMIT 1
          ),
          'None'
        )
      ) AS "likesInfo"
    FROM "Comment" c
    WHERE 
      c.id = $1 
      AND c."deletedAt" IS NULL
    `,
        params,
    );

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }
    return comment;
  }


  async getAll(
      query: GetCommentQueryParams,
      postId: number,
      userId?: number | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const pageNumber = Math.max(1, Number(query.pageNumber) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = ['createdAt', 'content'];
    const sortBy = allowedSortFields.includes(query.sortBy)
        ? query.sortBy
        : 'createdAt';

    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const baseConditions = [`c."deletedAt" IS NULL`, `c."postId" = $1`];

    const params: any[] = [postId];
    let paramIndex = 2;

    const whereClause = baseConditions.join(' AND ');

    const dataQuery = `
    SELECT 
      c.id::TEXT AS "id",
      c.content,
      json_build_object(
        'userId', c."userId"::TEXT,
        'userLogin', c."userLogin"
      ) AS "commentatorInfo",
      c."createdAt",
      json_build_object(
        'likesCount', c."likesCount",
        'dislikesCount', c."dislikesCount",
        'myStatus',
        CASE 
          WHEN $${paramIndex}::INTEGER IS NOT NULL THEN COALESCE(
            INITCAP((
              SELECT cl.status
              FROM "CommentLike" cl
              WHERE cl."commentId" = c.id
                AND cl."userId" = $${paramIndex}::INTEGER
              ORDER BY cl."addedAt" DESC
              LIMIT 1
            )),
            'None'
          )
          ELSE 'None'
        END
      ) AS "likesInfo"
    FROM "Comment" c
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY c."${sortBy}" ${sortDirection}
    LIMIT $${paramIndex + 1}
    OFFSET $${paramIndex + 2}
  `;

    params.push(userId ?? null);
    params.push(pageSize, skip);

    const comments = await this.dataSource.query(dataQuery, params);

    const countQuery = `
    SELECT COUNT(*)::int AS total_count 
    FROM "Comment" c
    WHERE c."deletedAt" IS NULL AND c."postId" = $1
  `;
    const countResult = await this.dataSource.query(countQuery, [postId]);
    const totalCount = countResult[0]?.total_count || 0;
    const pagesCount = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments,
    };
  }
}
