import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../sessions/domain/session.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Session.name)
    private sessionModel: SessionModelType,
    @InjectDataSource()
    protected datasource: DataSource,
  ) {}
  async deleteOtherDevices(
    userId: string,
    currentDeviceId: string,
  ): Promise<void> {
    await this.sessionModel.updateMany(
      {
        $and: [
          { userId },
          { deviceId: { $ne: currentDeviceId } },
          { deletedAt: null },
        ],
      },
      { deletedAt: new Date() },
    );
  }

  async findSession(filters: {
    userId?: number | string;
    deviceId?: string;
    deviceName?: string;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];

    conditions.push(`"deletedAt" IS NULL`);

    if (filters.userId) {
      conditions.push(`"userId" = $${params.length + 1}`);
      params.push(filters.userId);
    }

    if (filters.deviceId) {
      conditions.push(`"deviceId" = $${params.length + 1}`);
      params.push(filters.deviceId);
    }

    if (filters.deviceName) {
      conditions.push(
        `TRIM(LOWER("deviceName")) = TRIM(LOWER($${params.length + 1}))`,
      );
      params.push(filters.deviceName.trim());
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const query = `
      SELECT  * 
      FROM "Sessions"
      ${whereClause}
      LIMIT 1
    `;

    const result = await this.datasource.query(query, params);

    return result.length > 0 ? result[0] : null;
  }

  async save(session: SessionDocument) {
    await session.save();
  }

  async updateSession(iat: Date, exp: Date, sessionId: number) {
    const query = `
        UPDATE "Sessions"
        SET "createdAt" = $1,
            "expiresAt" = $2
        WHERE "id" = $3
    `;

    await this.datasource.query(query, [iat, exp, sessionId]);
  }

  async createSession(
    userId: number,
    iat: number,
    exp: number,
    deviceId: string,
    ip: string,
    deviceName: string,
  ) {
    const createdAt = new Date(iat * 1000);
    const expiresAt = new Date(exp * 1000);

    await this.datasource.query(
      `INSERT INTO "Sessions" (
          "userId",
          "createdAt",
          "expiresAt",
          "deviceId",
          "deviceName",
          ip
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, createdAt, expiresAt, deviceId, deviceName, ip],
    );
  }
}
