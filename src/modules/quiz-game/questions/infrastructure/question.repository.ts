import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Game } from '../../game/domain/game.entity';

@Injectable()
export class QuestionRepository {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async save(question: Question) {
    await this.questionRepository.save(question);
  }

  withManager(manager: EntityManager): QuestionRepository {
    return new QuestionRepository(manager.getRepository(Question));
  }

  async findByIdOrFail(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not Found',
      });
    }

    return question;
  }

  async softDelete(id: number): Promise<void> {
    await this.questionRepository.softDelete(id);
  }

  async findPublishedRandom(limit: number): Promise<Question[]> {
    return this.questionRepository
      .createQueryBuilder('q')
      .where('q.published = :published', { published: true })
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();
  }
}
