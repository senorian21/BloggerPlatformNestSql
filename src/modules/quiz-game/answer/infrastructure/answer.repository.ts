import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Answer, AnswerStatus } from '../domain/answer.entity';
import { Game } from '../../game/domain/game.entity';

@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly repo: Repository<Answer>,
  ) {}

  async save(answer: Answer): Promise<Answer> {
    return this.repo.save(answer);
  }

  withManager(manager: EntityManager): AnswerRepository {
    return new AnswerRepository(manager.getRepository(Answer));
  }

  async countCorrectByPlayerId(playerId: number): Promise<number> {
    return this.repo.count({
      where: { playerId, answerStatus: AnswerStatus.Correct },
    });
  }

  async countByPlayerId(playerId: number): Promise<number> {
    return this.repo.count({ where: { playerId } });
  }

  async findByPlayerId(playerId: number): Promise<Answer[]> {
    return this.repo.find({ where: { playerId } });
  }

  async hasCorrectAnswers(playerId: number): Promise<boolean> {
    const correct = await this.repo.findOne({
      where: { playerId, answerStatus: AnswerStatus.Correct },
    });
    return !!correct;
  }

  async findLastAnswer(playerId: number): Promise<Answer | null> {
    return this.repo.findOne({
      where: { playerId },
      order: { addedAt: 'DESC' },
    });
  }
}
