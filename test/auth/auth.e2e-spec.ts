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
  describe('Auth password recovery flow (e2e)', () => {
    it('❌ POST /api/auth/password-recovery should return 204 and call mailer only if user exists', async () => {
      const existingUser = {
        login: 'Recover',
        password: 'StrongPass1',
        email: 'recover1@example.com',
      };
      await userHelper.createUser(existingUser);

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: existingUser.email })
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
      expect(mailer.sendEmail).toHaveBeenCalledWith(
        existingUser.email,
        expect.any(String),
        expect.any(Function),
      );

      jest.clearAllMocks();

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: 'nonexistent@example.com' })
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).not.toHaveBeenCalled();
    });
    it('❌ POST /api/auth/password-recovery with invalid email should return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: 'bad*gmail.com' })
        .expect(400);
    });
    it('✅ POST /api/auth/new-password with valid code should return 204', async () => {
      const userData = {
        login: 'Recover2',
        password: 'StrongPass1',
        email: 'recover2@example.com',
      };
      await userHelper.createUser(userData);

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({ email: userData.email })
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).toHaveBeenCalled();
      const [to, recoveryCode, templateFn] = (mailer.sendEmail as jest.Mock)
        .mock.calls[0];

      const { html } = templateFn(recoveryCode);
      expect(html).toContain(recoveryCode);

      const newPassword = 'StrongPass123';
      await request(app.getHttpServer())
        .post('/api/auth/new-password')
        .send({ recoveryCode, newPassword })
        .expect(HttpStatus.NO_CONTENT);
    });
    it('❌ POST /api/auth/new-password with wrong code should return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/new-password')
        .send({ recoveryCode: 'wrong-code', newPassword: 'StrongPass123' })
        .expect(400);
    });
    it('❌ POST /api/auth/new-password with invalid password should return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/new-password')
        .send({ recoveryCode: 'some-code', newPassword: '123' }) // слишком короткий
        .expect(400);
    });
  });
  describe('Auth registration + email resending (e2e)', () => {
    it('should send email on registration and again on resending', async () => {
      const email = 'user@example.com';
      const password = 'StrongPass123';

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send({ email, password, login: 'testuser' })
        .expect(204);

      expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
      expect((mailer.sendEmail as jest.Mock).mock.calls[0][0]).toBe(email);

      await request(app.getHttpServer())
        .post('/api/auth/registration-email-resending')
        .send({ email })
        .expect(204);

      expect(mailer.sendEmail).toHaveBeenCalledTimes(2);
      expect((mailer.sendEmail as jest.Mock).mock.calls[1][0]).toBe(email);
    });
  });
  describe('Auth logout (e2e)', () => {
    it('✅ Should logout user with valid refreshToken cookie', async () => {
      const userData = {
        login: 'UsrLogout1',
        password: 'Strong123',
        email: 'logout1@example.com',
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

      const tokenValue = refreshTokenCookie!
        .split(';')[0]
        .replace('refreshToken=', '');

      const decoded: any = jwt.decode(tokenValue);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBeDefined();
      expect(decoded.deviceId).toBeDefined();

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', `refreshToken=${tokenValue}`)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', `refreshToken=${tokenValue}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
  describe('Auth me (e2e)', () => {
    it('✅ Should return current user info with valid accessToken', async () => {
      const userData = {
        login: 'UsrMe1',
        password: 'Strong123',
        email: 'me1@example.com',
      };
      await userHelper.createUser(userData);

      // 1. логин
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          loginOrEmail: userData.login,
          password: userData.password,
        })
        .expect(HttpStatus.OK);

      // достаём accessToken из тела ответа
      expect(loginResponse.body).toMatchObject({
        accessToken: expect.any(String),
      });
      const accessToken = loginResponse.body.accessToken;

      // 2. запрос к /me с Bearer токеном
      const meResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // 3. проверяем данные
      expect(meResponse.body).toMatchObject({
        email: userData.email,
        login: userData.login,
        userId: expect.any(String),
      });
    });
    it('❌ Should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
