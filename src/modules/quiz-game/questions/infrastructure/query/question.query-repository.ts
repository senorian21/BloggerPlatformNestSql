import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../../domain/question.entity';
import { Repository } from 'typeorm';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';

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
}
