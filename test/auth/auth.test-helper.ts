import { INestApplication, HttpStatus } from '@nestjs/common';
import request, { Response } from 'supertest';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  cookies: string[];
}

export class AuthTestHelper {
  constructor(private app: INestApplication) {}

  async login(
    loginOrEmail: string,
    password: string,
    deviceName?: string,
  ): Promise<LoginResult> {
    const payload = { loginOrEmail, password };

    let req = request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send(payload);

    if (deviceName) {
      req = req.set('User-Agent', deviceName);
    }

    const loginResponse = await req.expect(HttpStatus.OK);

    expect(loginResponse.body).toMatchObject({
      accessToken: expect.any(String),
    });

    const accessToken = loginResponse.body.accessToken;

    const cookiesRaw = loginResponse.headers['set-cookie'];
    const cookies = Array.isArray(cookiesRaw) ? cookiesRaw : [cookiesRaw];
    const refreshTokenCookie = cookies.find((c) =>
      c.startsWith('refreshToken='),
    );
    expect(refreshTokenCookie).toBeDefined();

    const refreshToken = refreshTokenCookie!
      .split(';')[0]
      .replace('refreshToken=', '');

    return { accessToken, refreshToken, cookies };
  }

  async logout(refreshToken: string): Promise<void> {
    await request(this.app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HttpStatus.NO_CONTENT);
  }
}
