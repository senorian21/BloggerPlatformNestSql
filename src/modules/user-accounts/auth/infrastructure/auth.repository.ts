import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../sessions/domain/session.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Session.name)
    private sessionModel: SessionModelType,
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
    userId?: string;
    deviceId?: string;
    deviceName?: string;
  }) {
    const query: any = { deletedAt: null };

    if (filters.userId) {
      query.userId = filters.userId;
    }
    if (filters.deviceId) query.deviceId = filters.deviceId;
    if (filters.deviceName) query.deviceName = filters.deviceName;

    return await this.sessionModel.findOne(query);
  }
  async save(session: SessionDocument) {
    await session.save();
  }
}
