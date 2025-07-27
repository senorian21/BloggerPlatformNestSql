import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionModelType,
} from '../../../sessions/domain/session.entity';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,

    @InjectDataSource()
    protected datasource: DataSource,
  ) {}
  async getAllSessionByUser(userId: number): Promise<SessionViewDto[]> {
    const sessions = await this.datasource.query(`
    SELECT 
      ip, 
      "deviceName" AS title, 
      "createdAt" AS "lastActiveDate",
      "deviceId"
    FROM "Sessions" 
    WHERE "userId" = $1
      AND "deletedAt" IS NULL
  `, [userId]);

    return sessions;
  }
}
