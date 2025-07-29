export class SessionDto {
  id: number;
  deletedAt: Date;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
  deviceId: string;
  deviceName: string;
  ip: string;
}
