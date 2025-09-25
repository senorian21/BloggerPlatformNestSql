import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from '../domain/answer.entity';

@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly repo: Repository<Answer>,
  ) {}

  async save(answer: Answer): Promise<Answer> {
    return this.repo.save(answer);
  }

  async countByPlayerId(playerId: number): Promise<number> {
    return this.repo.count({ where: { playerId } });
  }

  async findByPlayerId(playerId: number): Promise<Answer[]> {
    return this.repo.find({ where: { playerId } });
  }

  async findLastAnswerTime(playerId: number): Promise<Date | null> {
    const last = await this.repo.findOne({
      where: { playerId },
      order: { addedAt: 'DESC' },
    });
    return last ? last.addedAt : null;
  }
}
