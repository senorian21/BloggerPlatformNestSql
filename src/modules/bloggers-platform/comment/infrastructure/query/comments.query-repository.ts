import { Injectable } from '@nestjs/common';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetCommentQueryParams } from '../../api/input-dto/get-comment-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Comment } from '../../domain/comment.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}
  async getByIdOrNotFoundFail(
    id: number,
    userId?: number,
  ): Promise<CommentViewDto> {
    const qb = this.commentRepository
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .where('c.id = :id', { id })
      .andWhere('c.deletedAt IS NULL')
      .select([
        // простые поля
        'c.id::text AS id',
        'c.content AS content',
        'c.createdAt AS "createdAt"',
        // commentatorInfo как JSON
        `json_build_object(
        'userId', u.id::text,
        'userLogin', u.login
      ) AS "commentatorInfo"`,
        // likesInfo как JSON
        `json_build_object(
        'likesCount', c.likeCount,
        'dislikesCount', c.dislikeCount,
        'myStatus', COALESCE((
          SELECT INITCAP(cl.status)
          FROM "commentLike" cl
          WHERE cl."commentId" = c.id
            AND cl."userId" = :userId
            AND :userId IS NOT NULL
          ORDER BY cl."addedAt" DESC
          LIMIT 1
        ), 'None')
      ) AS "likesInfo"`,
      ]);

    const result = await qb
      .setParameters({ userId: userId ?? null })
      .getRawOne<CommentViewDto>();

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return result;
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

    const qb = this.commentRepository
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .where('c.deletedAt IS NULL')
      .andWhere('c.postId = :postId', { postId })
      .select([
        'c.id::text AS id',
        'c.content AS content',
        'c.createdAt AS "createdAt"',
        `json_build_object(
        'userId', u.id::text,
        'userLogin', u.login
      ) AS "commentatorInfo"`,
        `json_build_object(
        'likesCount', c.likeCount,
        'dislikesCount', c.dislikeCount,
        'myStatus', COALESCE((
          SELECT INITCAP(cl.status)
          FROM "commentLike" cl
          WHERE cl."commentId" = c.id
            AND cl."userId" = :userId
            AND :userId IS NOT NULL
          ORDER BY cl."addedAt" DESC
          LIMIT 1
        ), 'None')
      ) AS "likesInfo"`,
      ])
      .orderBy(`c.${sortBy}`, sortDirection as 'ASC' | 'DESC')
      .limit(pageSize)
      .offset(skip)
      .setParameters({ userId: userId ?? null });

    const [items, totalCount] = await Promise.all([
      qb.getRawMany<CommentViewDto>(),
      this.commentRepository.count({
        where: { postId, deletedAt: IsNull() },
      }),
    ]);

    const pagesCount = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }
}
