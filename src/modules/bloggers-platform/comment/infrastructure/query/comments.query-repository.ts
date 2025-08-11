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
import { PostRepository } from '../../../post/infrastructure/post.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: CommentModelType,
    private commentRepository: CommentRepository,
    private postRepository: PostRepository,

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
            (SELECT status 
             FROM "CommentLike" 
             WHERE "commentId" = c.id 
               AND "userId" = $2 
               AND $2 IS NOT NULL 
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
    // Валидация и подготовка параметров пагинации
    const pageNumber = Math.max(1, Number(query.pageNumber) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
    const skip = (pageNumber - 1) * pageSize;

    // Разрешенные поля для сортировки
    const allowedSortFields = ['createdAt', 'content'];
    const sortBy = allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';

    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';

    // Базовые условия (только активные комментарии для конкретного поста)
    const baseConditions = [`c."deletedAt" IS NULL`, `c."postId" = $1`];

    // Подготовка параметров для запроса
    const params: any[] = [postId];
    let paramIndex = 2; // Начинаем с $2, так как $1 уже занят postId

    const whereClause = baseConditions.join(' AND ');

    // Основной запрос для получения данных
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
            (SELECT status 
             FROM "CommentLike" 
             WHERE "commentId" = c.id 
               AND "userId" = $${paramIndex}::INTEGER), 
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

    // Добавляем userId как последний параметр перед пагинацией
    params.push(userId ?? null);

    // Добавляем параметры пагинации
    params.push(pageSize, skip);

    // Выполняем запрос на получение данных
    const comments = await this.dataSource.query(dataQuery, params);

    // Запрос для подсчета общего количества записей
    const countQuery = `
    SELECT COUNT(*)::int AS total_count 
    FROM "Comment" c
    WHERE c."deletedAt" IS NULL AND c."postId" = $1
  `;

    // Выполняем запрос на подсчет
    const countResult = await this.dataSource.query(countQuery, [postId]);
    const totalCount = countResult[0]?.total_count || 0;

    // Вычисляем количество страниц
    const pagesCount = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);

    // Возвращаем результат в формате пагинации
    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments,
    };
  }
}
