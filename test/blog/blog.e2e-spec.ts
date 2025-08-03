import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeEach(async () => {
    const testingModuleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    const moduleFixture: TestingModule = await testingModuleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    if (connection?.db) {
      const collections = await connection.db.listCollections().toArray();
      for (const collection of collections) {
        await connection.db.collection(collection.name).deleteMany({});
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create blog; POST /blogs', async () => {
    const Body = {
      name: 'Jaba',
      description: 'qwfsddsd',
      websiteUrl: 'https://someurl.com',
    };

    const response = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: Body.name,
      description: Body.description,
      websiteUrl: Body.websiteUrl.trim(),
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  it('should return blogs by id ; GET /blogs/:blogId', async () => {
    const Body1 = {
      name: 'Jaba',
      description: 'qwfsddsd',
      websiteUrl: 'https://someurl.com',
    };

    const Body2 = {
      name: 'Jaba',
      description: 'qwfsddsd',
      websiteUrl: 'https://someurl.com',
    };

    const blog1 = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body1)
      .expect(HttpStatus.CREATED);

    const blog2 = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body2)
      .expect(HttpStatus.CREATED);

    const response = await request(app.getHttpServer())
      .get(`/blogs/${blog1.body.id}`)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: Body1.name,
      description: Body1.description,
      websiteUrl: Body1.websiteUrl.trim(),
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  it('should return blogs list ; GET /blogs', async () => {
    const Body = {
      name: 'Jaba',
      description: 'qwfsddsd',
      websiteUrl: 'https://someurl.com',
    };

    const blog1 = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body)
      .expect(HttpStatus.CREATED);

    const blog2 = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body)
      .expect(HttpStatus.CREATED);

    const response = await request(app.getHttpServer())
      .get(`/blogs`)
      .query({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      .expect(HttpStatus.OK);

    expect(response.body.items.length).toEqual(2);
    expect(response.body.page).toBe(1);
    expect(response.body.pagesCount).toBe(1);
    expect(response.body.pageSize).toBe(10);
    expect(response.body.totalCount).toBe(2);
  });

  it('should update blogs; PUT /blogs/:id', async () => {
    const Body = {
      name: 'Jaba',
      description: 'qwfsddsd',
      websiteUrl: 'https://someurl.com',
    };

    const blog = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body)
      .expect(HttpStatus.CREATED);

    const Body2 = {
      name: 'Jaba123',
      description: 'qwfsddsd123',
      websiteUrl: 'https://someurl.com123',
    };

    const updateBlog = await request(app.getHttpServer())
      .put(`/blogs/${blog.body.id}`)
      .auth('admin', 'qwerty')
      .send(Body2)
      .expect(HttpStatus.NO_CONTENT);

    const response = await request(app.getHttpServer())
      .get(`/blogs/${blog.body.id}`)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: Body2.name,
      description: Body2.description,
      websiteUrl: Body2.websiteUrl.trim(),
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  it('DELETE blogs/:id and check after NOT FOUND', async () => {
    const Body = {
      name: 'Jaba',
      description: 'qwfsddsd',
      websiteUrl: 'https://someurl.com',
    };

    const blog = await request(app.getHttpServer())
      .post(`/blogs`)
      .auth('admin', 'qwerty')
      .send(Body)
      .expect(HttpStatus.CREATED);

    const response1 = await request(app.getHttpServer())
      .get(`/blogs/${blog.body.id}`)
      .expect(HttpStatus.OK);

    expect(response1.body).toEqual({
      id: expect.any(String),
      name: Body.name,
      description: Body.description,
      websiteUrl: Body.websiteUrl.trim(),
      createdAt: expect.any(String),
      isMembership: false,
    });

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/blogs/${blog.body.id}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);

    const response2 = await request(app.getHttpServer())
      .get(`/blogs/${blog.body.id}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});
