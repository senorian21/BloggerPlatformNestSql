import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { SessionDto } from '../dto/session.dto';
import { Session } from '../../security/domain/session.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectDataSource()
    protected datasource: DataSource,

    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}
  async deleteOtherDevices(
    userId: number,
    currentDeviceId: string,
  ): Promise<void> {
    await this.sessionRepository.softDelete({
      userId,
      deviceId: Not(currentDeviceId),
    });
  }

  async findSession(filters: {
    userId?: number;
    deviceId?: string;
    deviceName?: string;
  }): Promise<Session | null> {
    const where: any = { deletedAt: IsNull() };

    if (filters.userId) where.userId = filters.userId;
    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.deviceName) where.deviceName = filters.deviceName.trim();

    return this.sessionRepository.findOne({ where });
  }

  async softDeleteSession(id: number): Promise<void> {
    await this.sessionRepository.softDelete(id);
  }

  async saveSession(session: Session): Promise<void> {
    await this.sessionRepository.save(session);
  }
}
