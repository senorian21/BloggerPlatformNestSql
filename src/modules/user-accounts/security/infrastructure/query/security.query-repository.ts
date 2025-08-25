import { Injectable } from '@nestjs/common';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Session} from "../../domain/session.entity";

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}
  async getAllSessionByUser(userId: number): Promise<SessionViewDto[]> {
    const sessions = await this.sessionRepository
        .createQueryBuilder('s')
        .select([
          's.ip AS ip',
          's.deviceName AS title',
          's.createdAt AS "lastActiveDate"',
          's.deviceId AS "deviceId"',
        ])
        .where('s.userId = :userId', { userId })
        .andWhere('s.deletedAt IS NULL')
        .getRawMany<SessionViewDto>();

    return sessions;
  }
}
