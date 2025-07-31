import { SessionDto } from '../../../auth/dto/session.dto';

export class SessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;

  static mapToView = (session: SessionDto): SessionViewDto => {
    const dto = new SessionViewDto();
    dto.ip = session.ip;
    dto.title = session.deviceName;
    dto.lastActiveDate = new Date(Number(session.createdAt) * 1000);
    dto.deviceId = session.deviceId;
    return dto;
  };
}
