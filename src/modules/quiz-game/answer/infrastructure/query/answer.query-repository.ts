import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../../domain/answer.entity';
import { Repository } from 'typeorm';
import { PlayerAnswerDto } from '../../api/view-dto/answer.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class AnswerQueryRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  async findPlayerAnswerById(
    answerId: number,
    questionId: number,
  ): Promise<PlayerAnswerDto> {
    const raw = await this.answerRepository
      .createQueryBuilder('a')
      .innerJoin('a.player', 'p')
      .innerJoin('game', 'g', 'g.player_1_id = p.id OR g.player_2_id = p.id')
      .innerJoin('gameQuestion', 'gq', 'gq."gameId" = g.id')
      .where('a.id = :answerId', { answerId })
      .andWhere('gq."questionId" = :questionId', { questionId })
      .select([
        'gq."questionId" AS "questionId"', // ✅ берём из gameQuestion
        'a.answerStatus AS "answerStatus"',
        'a.addedAt AS "addedAt"',
      ])
      .getRawOne<{
        questionId: number | null;
        answerStatus: string | null;
        addedAt: Date | null;
      }>();

    if (!raw || raw.questionId == null) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Answer not found',
      });
    }

    return {
      questionId: String(questionId),
      answerStatus: raw.answerStatus,
      addedAt: raw.addedAt,
    };
  }
}
