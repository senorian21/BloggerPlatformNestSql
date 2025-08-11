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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,

    @InjectDataSource()
    private dataSource: DataSource,
    private blogQueryRepository: BlogQueryRepository,
    private postsRepository: PostRepository,
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
        'myStatus', COALESCE(
          (SELECT status 
           FROM "PostLike" 
           WHERE "postId" = p.id 
             AND "userId" = $2 
             AND $2 IS NOT NULL 
          ), 
          'None'
        ),
        'newestLikes', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
              'addedAt', "addedAt",
              'userId', "userId"::TEXT,
              'login', login
            ) ORDER BY "addedAt" DESC)
           FROM (
             SELECT 
               pl."addedAt", 
               pl."userId", 
               u.login
             FROM "PostLike" pl
             JOIN "User" u ON pl."userId" = u.id
             WHERE 
               pl."postId" = p.id 
               AND pl.status = 'Like'
             ORDER BY pl."addedAt" DESC
             LIMIT 3
           ) AS latest_likes
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

    if (post.length === 0) {
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

    // Разрешенные поля для сортировки
    const allowedSortFields = ['createdAt', 'blogName', 'title'];
    const sortBy = allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';

    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';

    // Базовые условия (только активные посты)
    const baseConditions = [`p."deletedAt" IS NULL`];

    // Подготовка параметров для запроса
    const params: any[] = [];
    let paramIndex = 1;

    // Добавляем blogId в условия, если передан
    if (blogId !== undefined) {
      baseConditions.push(`p."blogId" = $${paramIndex}`);
      params.push(blogId);
      paramIndex++;
    }

    const whereClause = baseConditions.join(' AND ');

    // Основной запрос для получения данных
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
          -- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: явное приведение типа для параметра в условии
          WHEN $${paramIndex}::INTEGER IS NOT NULL THEN COALESCE(
            (SELECT status 
             FROM "PostLike" 
             WHERE "postId" = p.id 
               AND "userId" = $${paramIndex}::INTEGER), 
            'None'
          )
          ELSE 'None'
        END,
        'newestLikes', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
              'addedAt', "addedAt",
              'userId', "userId"::TEXT,
              'login', login
            ) ORDER BY "addedAt" DESC)
           FROM (
             SELECT 
               pl."addedAt", 
               pl."userId", 
               u.login
             FROM "PostLike" pl
             JOIN "User" u ON pl."userId" = u.id
             WHERE 
               pl."postId" = p.id 
               AND pl.status = 'Like'
             ORDER BY pl."addedAt" DESC
             LIMIT 3
           ) AS latest_likes
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

    // Добавляем userId как последний параметр перед пагинацией
    params.push(userId ?? null);

    // Добавляем параметры пагинации
    params.push(pageSize, skip);

    // Выполняем запрос на получение данных
    const posts = await this.dataSource.query(dataQuery, params);

    // Запрос для подсчета общего количества записей
    const countQuery = `
    SELECT COUNT(*)::int AS total_count 
    FROM "Post" p
    ${whereClause ? `WHERE ${whereClause}` : ''}
  `;

    // Выполняем запрос на подсчет
    const countParams = blogId !== undefined ? [blogId] : [];
    const countResult = await this.dataSource.query(countQuery, countParams);

    const totalCount = countResult[0]?.total_count || 0;

    // Возвращаем результат в формате пагинации
    return PaginatedViewDto.mapToView({
      items: posts,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
