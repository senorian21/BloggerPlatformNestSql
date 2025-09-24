import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../../domain/question.entity';
import { Repository } from 'typeorm';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetQuestionQueryParams } from '../../api/input-dto/get-queston-query-params.input-dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class QuestionQueryRepository {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async getByIdOrNotFoundFail(id: number): Promise<QuestionViewDto> {
    const question = await this.questionRepository
      .createQueryBuilder('q')
      .select([
        'q.id::text AS id',
        'q.body AS body',
        'q.correctAnswers AS "correctAnswers"',
        'q.published AS published',
        'q.createdAt AS "createdAt"',
        'q.updatedAt AS "updatedAt"',
      ])
      .where('q.id = :id', { id })
      .andWhere('q.deletedAt IS NULL')
      .getRawOne<QuestionViewDto>();

    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found.',
      });
    }
    return question;
  }

  async getAll(
    query: GetQuestionQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const queryParams = plainToClass(GetQuestionQueryParams, query);

    // Пагинация
    const pageNumber = Math.max(1, Number(queryParams.pageNumber) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(queryParams.pageSize) || 10),
    );
    const skip = (pageNumber - 1) * pageSize;

    // Сортировка
    const allowedSortFields = ['body', 'createdAt', 'published'] as const;
    const sortBy = allowedSortFields.includes(queryParams.sortBy as any)
      ? (queryParams.sortBy as (typeof allowedSortFields)[number])
      : 'createdAt';
    const sortDirection: 'ASC' | 'DESC' =
      queryParams.sortDirection === 'asc' ? 'ASC' : 'DESC';

    // Фильтры
    const bodySearch = queryParams.bodySearchTerm?.trim();
    const publishedStatus = queryParams.publishedStatus || 'all';

    const qb = this.questionRepository
      .createQueryBuilder('q')
      .select([
        'q.id::text AS id',
        'q.body AS body',
        'q.correctAnswers AS "correctAnswers"',
        'q.published AS published',
        'q.createdAt AS "createdAt"',
        'q.updatedAt AS "updatedAt"',
      ])
      .where('q.deletedAt IS NULL');

    // Фильтр по body
    if (bodySearch) {
      qb.andWhere('LOWER(q.body) LIKE LOWER(:body)', {
        body: `%${bodySearch}%`,
      });
    }

    if (publishedStatus === 'published') {
      qb.andWhere('q.published = true');
    } else if (publishedStatus === 'notPublished') {
      qb.andWhere('q.published = false');
    }

    qb.orderBy(`q.${sortBy}`, sortDirection).skip(skip).take(pageSize);

    const questions = await qb.getRawMany<QuestionViewDto>();

    // Подсчёт общего количества
    const countQb = this.questionRepository
      .createQueryBuilder('q')
      .where('q.deletedAt IS NULL');

    if (bodySearch) {
      countQb.andWhere('LOWER(q.body) LIKE LOWER(:body)', {
        body: `%${bodySearch}%`,
      });
    }

    if (publishedStatus === 'published') {
      countQb.andWhere('q.published = true');
    } else if (publishedStatus === 'notPublished') {
      countQb.andWhere('q.published = false');
    }

    const totalCount = await countQb.getCount();

    return PaginatedViewDto.mapToView({
      items: questions,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
