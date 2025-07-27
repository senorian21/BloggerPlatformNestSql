export class RefreshTokenContextDto {
  userId: number;
  deviceId: string;
  deviceName: string;
  ip: string;
  iat: number;
  exp: number;
}

export type Nullable<T> = { [P in keyof T]: T[P] | null };
