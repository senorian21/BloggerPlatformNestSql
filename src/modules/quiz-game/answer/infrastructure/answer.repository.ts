import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Answer, AnswerStatus } from '../domain/answer.entity';
import { Game } from '../../game/domain/game.entity';

@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  async save(answer: Answer): Promise<Answer> {
    return this.answerRepository.save(answer);
  }

  withManager(manager: EntityManager): AnswerRepository {
    return new AnswerRepository(manager.getRepository(Answer));
  }

  async countCorrectByPlayerId(playerId: number): Promise<number> {
    return this.answerRepository.count({
      where: { playerId, answerStatus: AnswerStatus.Correct },
    });
  }

  async countByPlayerId(playerId: number): Promise<number> {
    return this.answerRepository.count({ where: { playerId } });
  }

  async findByPlayerId(playerId: number): Promise<Answer[]> {
    return this.answerRepository.find({ where: { playerId } });
  }

  async findLastAnswer(playerId: number): Promise<Answer | null> {
    return this.answerRepository.findOne({
      where: { playerId },
      order: { addedAt: 'DESC' },
    });
  }

  async findByPlayerIdAsc(playerId: number): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { playerId },
      order: { addedAt: 'ASC' },
    });
  }
}
