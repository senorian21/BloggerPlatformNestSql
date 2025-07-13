import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionModelType,
} from '../../../sessions/domain/session.entity';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}
  async getAllSessionByUser(userId: string): Promise<SessionViewDto[]> {
    const sessions = await this.SessionModel.find({ userId, deletedAt: null });

    return sessions.map((session) => SessionViewDto.mapToView(session));
  }
}
