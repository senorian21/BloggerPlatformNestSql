import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initApp } from '../helper/app.test-helper';
import { UsersTestHelper } from '../user/user.test-helper';
import request from 'supertest';
import { NodemailerService } from '../../src/modules/user-accounts/adapters/nodemeiler/nodemeiler.service';
import * as jwt from 'jsonwebtoken';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let userHelper: UsersTestHelper;
  let mailer: NodemailerService;

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    dataSource = init.dataSource;
    userHelper = new UsersTestHelper(app);

    mailer = app.get<NodemailerService>(NodemailerService);
  });

  beforeEach(async () => {
    await dataSource.query(`SELECT truncate_tables('postgres');`);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });
  describe('Auth login (e2e)', () => {
    it('✅ Correct login; POST /api/auth/login', async () => {
      const validUserData = {
        login: 'ValidL',
        password: 'ValidPass',
        email: 'exampleEm@example.com',
      };

      const createUserResponse = await userHelper.createUser(validUserData);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: validUserData.login,
          password: validUserData.password,
        })
        .expect(HttpStatus.OK);

      expect(loginResponse.body).toMatchObject({
        accessToken: expect.any(String),
      });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=.*HttpOnly/);
    });
    it('❌ Wrong password should return 401', async () => {
      const userData = {
        login: 'Usr401',
        password: 'Correct1',
        email: 'wrongpass401@example.com',
      };

      await userHelper.createUser(userData);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: userData.login,
          password: 'Wrong123',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it('❌ Wrong login/email should return 401', async () => {
      const userData = {
        login: 'Usr402',
        password: 'Correct2',
        email: 'wronglogin402@example.com',
      };

      await userHelper.createUser(userData);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: 'NotExistUser',
          password: userData.password,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it('❌ Invalid input model should return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: '',
          password: '',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Too many attempts should return 429', async () => {
      const userData = {
        login: 'Usr429',
        password: 'Correct3',
        email: 'ratelimit429@example.com',
      };

      await userHelper.createUser(userData);

      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer()).post('/api/auth/login').send({
          loginOrEmail: userData.login,
          password: 'Wrong123',
        });
      }

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: userData.login,
          password: 'Wrong123',
        })
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
  describe('Auth Refresh Token (e2e)', () => {
    it('✅ Should refresh tokens with valid refreshToken cookie', async () => {
      const userData = {
        login: 'UsrRef1',
        password: 'Strong123',
        email: 'ref1@example.com',
      };
      await userHelper.createUser(userData);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: userData.login,
          password: userData.password,
        })
        .expect(HttpStatus.OK);

      const cookiesRaw = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(cookiesRaw) ? cookiesRaw : [cookiesRaw];
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith('refreshToken='),
      );
      expect(refreshTokenCookie).toBeDefined();

      const oldTokenValue = refreshTokenCookie!
        .split(';')[0]
        .replace('refreshToken=', '');

      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh-token')
        .set('Cookie', `refreshToken=${oldTokenValue}`)
        .expect(HttpStatus.OK);

      expect(refreshResponse.body).toMatchObject({
        accessToken: expect.any(String),
      });

      const newCookiesRaw = refreshResponse.headers['set-cookie'];
      const newCookies = Array.isArray(newCookiesRaw)
        ? newCookiesRaw
        : [newCookiesRaw];
      const newRefreshToken = newCookies.find((c) =>
        c.startsWith('refreshToken='),
      );
      expect(newRefreshToken).toBeDefined();

      const newTokenValue = newRefreshToken!
        .split(';')[0]
        .replace('refreshToken=', '');

      const oldDecoded: any = jwt.decode(oldTokenValue);
      const newDecoded: any = jwt.decode(newTokenValue);

      expect(oldDecoded).toBeDefined();
      expect(newDecoded).toBeDefined();
      expect(newDecoded.userId).toEqual(oldDecoded.userId);
      expect(newDecoded.deviceId).toEqual(oldDecoded.deviceId);

      expect(newDecoded.iat).toBeGreaterThanOrEqual(oldDecoded.iat);

      if (newDecoded.iat !== oldDecoded.iat) {
        expect(newTokenValue).not.toEqual(oldTokenValue);
      }
    });
    it('❌ Should return 401 if no refreshToken cookie provided', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it('❌ Should return 401 if refreshToken is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh-token')
        .set('Cookie', 'refreshToken=InvalidToken')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
  describe('Auth registration (e2e)', () => {
    it('✅ Should register user and send confirmation email', async () => {
      const userData = {
        login: 'RegUser1',
        password: 'StrongPass1',
        email: 'reguser1@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
      expect(mailer.sendEmail).toHaveBeenCalledWith(
        userData.email,
        expect.any(String),
        expect.any(Function),
      );
    });
    it('❌ Should return 400 if login already exists', async () => {
      const userData = {
        login: 'RegUser2',
        password: 'StrongPass2',
        email: 'reguser2@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send({
          login: 'RegUser2',
          password: 'AnotherPass',
          email: 'other@example.com',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            field: 'login',
            message: expect.any(String),
          }),
        ]),
      });
    });
    it('❌ Should return 429 if too many attempts', async () => {
      const userData = {
        login: 'RegUser3',
        password: 'StrongPass3',
        email: 'ratelimit@example.com',
      };

      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/registration')
          .send({ ...userData, email: `ratelimit${i}@example.com` });
      }

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send({ ...userData, email: 'ratelimitFinal@example.com' })
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
  describe('Auth Password Recovery (e2e)', () => {
    it('✅ Should return 204 and send recovery email if email exists', async () => {
      const userData = {
        login: 'Recover',
        password: 'StrongPass1',
        email: 'recover1@example.com',
      };
      await userHelper.createUser(userData);

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: userData.email })
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
      expect(mailer.sendEmail).toHaveBeenCalledWith(
        userData.email,
        expect.any(String),
        expect.any(Function),
      );
    });
    it('❌ Using an incorrect email for recovery', async () => {
      const userData = {
        login: 'Recover',
        password: 'StrongPass1',
        email: 'recover1@example.com',
      };
      await userHelper.createUser(userData);

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should return 429 if more than 5 attempts in 10 seconds from same IP', async () => {
      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/password-recovery')
          .send({ email: `ratelimit${i}@example.com` });
      }

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: 'ratelimitFinal@example.com' })
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
