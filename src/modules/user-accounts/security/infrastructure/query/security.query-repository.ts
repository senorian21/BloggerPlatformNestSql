import { Injectable } from '@nestjs/common';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";

@Injectable()
export class SessionsQueryRepository {
  constructor(
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
