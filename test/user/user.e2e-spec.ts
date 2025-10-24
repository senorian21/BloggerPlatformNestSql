import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initApp } from '../helper/app.test-helper';
import request from 'supertest';

describe('User (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    dataSource = init.dataSource;
  });

  beforeEach(async () => {
    await dataSource.query(`SELECT truncate_tables('postgres');`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('✅Correct user creation; POST /api/sa/users', async () => {
    const validUserData = {
      login: 'ValidLogin',
      password: 'ValidPassword',
      email: 'exampleValidEmail@example.com',
    };

    const createUserResponse = await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send(validUserData)
      .expect(HttpStatus.CREATED);

    expect(createUserResponse.body).toMatchObject({
      id: expect.any(String),
      login: validUserData.login,
      email: validUserData.email,
      createdAt: expect.any(String),
    });

    expect(createUserResponse.body).not.toHaveProperty('password');
  });
  it('❌Incorrect user creation; POST /api/sa/users', async () => {
    const validUserData = {
      login: 'ValidLogin',
      password: 'ValidPassword',
      email: 'exampleValidEmail@example.com',
    };

    await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send({ ...validUserData, login: '' })
      .expect(HttpStatus.BAD_REQUEST);

    await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send({ ...validUserData, password: '' })
      .expect(HttpStatus.BAD_REQUEST);

    await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send({ ...validUserData, email: '' })
      .expect(HttpStatus.BAD_REQUEST);

    await request(app.getHttpServer())
      .post('/api/sa/users')
      .send(validUserData)
      .expect(HttpStatus.UNAUTHORIZED);
  });
  it('✅ Correct user delete; DELETE /api/sa/users/:userId', async () => {
    const validUserData = {
      login: 'Valid1',
      password: 'ValidPassword1',
      email: 'example@example.com',
    };

    const createUserResponse = await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send(validUserData)
      .expect(HttpStatus.CREATED);

    const userId = createUserResponse.body.id;

    await request(app.getHttpServer())
      .delete(`/api/sa/users/${userId}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);

    const getUserResponse = await request(app.getHttpServer())
      .get(`/api/sa/users`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    expect(getUserResponse.body).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });
  });
  it('❌ Incorrect user delete; DELETE /api/sa/users/:userId', async () => {
    const validUserData = {
      login: 'Valid1',
      password: 'ValidPassword1',
      email: 'example@example.com',
    };

    const createUserResponse = await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send(validUserData)
      .expect(HttpStatus.CREATED);

    const userId = createUserResponse.body.id;

    await request(app.getHttpServer())
      .delete(`/api/sa/users/${userId}`)
      .expect(HttpStatus.UNAUTHORIZED);

    const fakeId = '9999';
    await request(app.getHttpServer())
      .delete(`/api/sa/users/${fakeId}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NOT_FOUND);
  });
  it('✅ Get users with default pagination', async () => {
    // создаём 1 пользователя
    const userData = {
      login: 'UserOne',
      password: 'Password1',
      email: 'user1@example.com',
    };

    await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send(userData)
      .expect(HttpStatus.CREATED);

    const response = await request(app.getHttpServer())
      .get('/api/sa/users')
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      pagesCount: expect.any(Number),
      page: 1,
      pageSize: 10,
      totalCount: expect.any(Number),
      items: expect.any(Array),
    });

    expect(response.body.items[0]).toMatchObject({
      id: expect.any(String),
      login: 'UserOne',
      email: 'user1@example.com',
      createdAt: expect.any(String),
    });
  });
  it('✅ Pagination works correctly', async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app.getHttpServer())
        .post('/api/sa/users')
        .auth('admin', 'qwerty')
        .send({
          login: `User${i}`,
          password: 'Password123',
          email: `user${i}@example.com`,
        })
        .expect(HttpStatus.CREATED);
    }

    const page1 = await request(app.getHttpServer())
      .get('/api/sa/users')
      .query({ pageNumber: 1, pageSize: 2 })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    expect(page1.body.items.length).toBe(2);

    const page2 = await request(app.getHttpServer())
      .get('/api/sa/users')
      .query({ pageNumber: 2, pageSize: 2 })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    expect(page2.body.items.length).toBe(1);
  });
  it('✅ Sorting works (asc vs desc)', async () => {
    const users = [
      { login: 'Alpha', password: 'Pass123', email: 'alpha@example.com' },
      { login: 'Charlie', password: 'Pass123', email: 'charlie@example.com' },
      { login: 'Bravo', password: 'Pass123', email: 'bravo@example.com' },
    ];

    for (const u of users) {
      await request(app.getHttpServer())
        .post('/api/sa/users')
        .auth('admin', 'qwerty')
        .send(u)
        .expect(HttpStatus.CREATED);
    }

    const asc = await request(app.getHttpServer())
      .get('/api/sa/users')
      .query({ sortBy: 'login', sortDirection: 'asc' })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    const desc = await request(app.getHttpServer())
      .get('/api/sa/users')
      .query({ sortBy: 'login', sortDirection: 'desc' })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    const ascLogins = asc.body.items.map((u) => u.login);
    const descLogins = desc.body.items.map((u) => u.login);

    expect([...ascLogins].sort()).toEqual(ascLogins);
    expect([...descLogins].sort().reverse()).toEqual(descLogins);
  });
  it('✅ Search by login and email works', async () => {
    const validUserData = {
      login: 'ValidU',
      password: 'StrongPass123',
      email: 'example@example.com',
    };

    await request(app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send(validUserData)
      .expect(HttpStatus.CREATED);

    const byLogin = await request(app.getHttpServer())
      .get('/api/sa/users')
      .query({ searchLoginTerm: 'Valid' })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    expect(byLogin.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ login: expect.stringMatching(/Valid/i) }),
      ]),
    );

    const byEmail = await request(app.getHttpServer())
      .get('/api/sa/users')
      .query({ searchEmailTerm: 'example.com' })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK);

    expect(byEmail.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: expect.stringMatching(/example\.com/i),
        }),
      ]),
    );
  });
  it('❌ Unauthorized request should return 401', async () => {
    await request(app.getHttpServer())
      .get('/api/sa/users')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
