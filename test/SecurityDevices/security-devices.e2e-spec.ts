import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initApp } from '../helper/app.test-helper';
import { AuthTestHelper } from '../auth/auth.test-helper';
import { UsersTestHelper } from '../user/user.test-helper';
import request from 'supertest';
import { Session } from '../../src/modules/user-accounts/security/domain/session.entity';

describe('Security Devices', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let authTestHelper: AuthTestHelper;
  let usersTestHelper: UsersTestHelper;

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    dataSource = init.dataSource;

    authTestHelper = new AuthTestHelper(app);
    usersTestHelper = new UsersTestHelper(app);
  });

  beforeEach(async () => {
    await dataSource.query(`SELECT truncate_tables('postgres');`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('✅ Creating a session; POST /api/auth/login', async () => {
    const userDate = {
      login: 'Test1',
      password: 'TestPassword',
      email: 'exampleVal@example.com',
    };

    const userCreateResponse = await usersTestHelper.createUser(userDate);

    const testDeviceName = 'testDeviceName';

    const loginResponse = await authTestHelper.login(
      userDate.login,
      userDate.password,
      testDeviceName,
    );

    const getSessionResponse = await request(app.getHttpServer())
      .get('/api/security/devices')
      .set('Cookie', loginResponse.cookies)
      .expect(HttpStatus.OK);

    expect(Array.isArray(getSessionResponse.body)).toBe(true);
    expect(getSessionResponse.body.length).toBeGreaterThan(0);

    expect(getSessionResponse.body[0]).toEqual(
      expect.objectContaining({
        ip: expect.any(String),
        title: testDeviceName,
        lastActiveDate: expect.any(String),
        deviceId: expect.any(String),
      }),
    );
  });
  it('✅ Get all session list; GET /api/security/devices', async () => {
    const userData = {
      login: 'Test2',
      password: 'Test2Password',
      email: 'exampleVal2@example.com',
    };

    await usersTestHelper.createUser(userData);

    const testDeviceName1 = 'testDeviceName1';
    const testDeviceName2 = 'testDeviceName2';
    const testDeviceName3 = 'testDeviceName3';

    const loginResponse1 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName1,
    );
    const loginResponse2 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName2,
    );
    const loginResponse3 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName3,
    );

    const getSessionResponse = await request(app.getHttpServer())
      .get('/api/security/devices')
      .set('Cookie', loginResponse3.cookies)
      .expect(HttpStatus.OK);

    const sessions = getSessionResponse.body;

    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions).toHaveLength(3);

    sessions.forEach((session: any) => {
      expect(session).toEqual(
        expect.objectContaining({
          ip: expect.any(String),
          title: expect.any(String),
          lastActiveDate: expect.any(String),
          deviceId: expect.any(String),
        }),
      );
    });

    const titles = sessions.map((s: any) => s.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        testDeviceName1,
        testDeviceName2,
        testDeviceName3,
      ]),
    );
  });
  it('✅ Deleting all sessions except the active one; DELETE /api/security/devices', async () => {
    const userData = {
      login: 'Test2',
      password: 'Test2Password',
      email: 'exampleVal2@example.com',
    };

    await usersTestHelper.createUser(userData);

    const testDeviceName1 = 'testDeviceName1';
    const testDeviceName2 = 'testDeviceName2';
    const testDeviceName3 = 'testDeviceName3';

    const loginResponse1 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName1,
    );
    const loginResponse2 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName2,
    );
    const loginResponse3 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName3,
    );

    const getSessionResponse = await request(app.getHttpServer())
      .get('/api/security/devices')
      .set('Cookie', loginResponse3.cookies)
      .expect(HttpStatus.OK);

    const sessions = getSessionResponse.body;

    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions).toHaveLength(3);

    const deleteResponse = await request(app.getHttpServer())
      .delete('/api/security/devices')
      .set('Cookie', loginResponse3.cookies)
      .expect(HttpStatus.NO_CONTENT);

    const getSessionResponse2 = await request(app.getHttpServer())
      .get('/api/security/devices')
      .set('Cookie', loginResponse3.cookies)
      .expect(HttpStatus.OK);

    const sessions2 = getSessionResponse2.body;

    expect(Array.isArray(sessions2)).toBe(true);
    expect(sessions2).toHaveLength(1);
  });
  it('✅ Delete session by id; DELETE /api/security/devices/:deviceId', async () => {
    const userData = {
      login: 'Test2',
      password: 'Test2Password',
      email: 'exampleVal2@example.com',
    };

    const userCreateResponse = await usersTestHelper.createUser(userData);

    const testDeviceName1 = 'testDeviceName1';
    const testDeviceName2 = 'testDeviceName2';

    const loginResponse1 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName1,
    );
    const loginResponse2 = await authTestHelper.login(
      userData.login,
      userData.password,
      testDeviceName2,
    );

    const firstSession = await dataSource.getRepository(Session).findOne({
      where: { userId: userCreateResponse.body.id },
      order: { createdAt: 'ASC' },
    });

    expect(firstSession).toBeDefined();
    const deviceIdToDelete = firstSession!.deviceId;

    await request(app.getHttpServer())
      .delete(`/api/security/devices/${deviceIdToDelete}`)
      .set('Cookie', loginResponse2.cookies)
      .expect(HttpStatus.NO_CONTENT);

    const getSessionResponse = await request(app.getHttpServer())
      .get('/api/security/devices')
      .set('Cookie', loginResponse2.cookies)
      .expect(HttpStatus.OK);

    const sessions = getSessionResponse.body;

    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions).toHaveLength(1);

    expect(sessions[0]).toEqual(
      expect.objectContaining({
        title: testDeviceName2,
        deviceId: expect.any(String),
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
      }),
    );
  });
});
