import { SessionDocument } from '../../../sessions/domain/session.entity';

export class SessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView = (session: SessionDocument): SessionViewDto => {
    const dto = new SessionViewDto();
    dto.ip = session.ip;
    dto.title = session.deviceName;
    dto.lastActiveDate = new Date(Number(session.createdAt) * 1000);
    dto.deviceId = session.deviceId;
    return dto;
  };
}
