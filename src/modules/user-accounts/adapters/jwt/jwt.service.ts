import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { appConfig } from './settings.jwt';

interface Token {
  userId: string;
  ip?: string;
  deviceName?: string;
  deviceId?: string;
}

@Injectable()
export class JwtService {
  private readonly secretAccessToken: string;
  private readonly timeAccessToken: string;
  private readonly secretRefreshToken: string;
  private readonly timeRefreshToken: string;

  constructor(private readonly configService: ConfigService) {
    this.secretAccessToken = appConfig.SECRET_ACCESS_TOKEN;
    this.timeAccessToken = appConfig.TIME_ACCESS_TOKEN;
    this.secretRefreshToken = appConfig.SECRET_REFRESH_TOKEN;
    this.timeRefreshToken = appConfig.TIME_REFRESH_TOKEN;
  }

  async createToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, this.secretAccessToken, {
      expiresIn: this.timeAccessToken,
    } satisfies jwt.SignOptions);
  }

  async createRefreshToken(
    userId: string,
    ip: string,
    deviceName: string,
    deviceId?: string,
  ): Promise<{ token: string; cookie: string }> {
    const actualDeviceId = deviceId || randomUUID();
    const refreshToken = jwt.sign(
      {
        userId,
        ip,
        deviceName,
        deviceId: actualDeviceId,
      },
      this.secretRefreshToken,
      {
        expiresIn: this.timeRefreshToken,
      } as jwt.SignOptions,
    );

    const cookie = `refreshToken=${refreshToken}; HttpOnly; Secure; Path=/; Max-Age=${parseInt(this.timeRefreshToken)}`;
    return { token: refreshToken, cookie };
  }

  async verifyJwt(token: string, secret: string): Promise<Token | null> {
    const payload = jwt.verify(token, secret) as Token;

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return null;
    }

    return payload;
  }

  async verifyToken(token: string) {
    return this.verifyJwt(token, this.secretAccessToken);
  }

  async verifyRefreshToken(token: string) {
    return this.verifyJwt(token, this.secretRefreshToken);
  }
}
