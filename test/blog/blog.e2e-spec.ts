import { INestApplication, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {initApp} from "../utils/app.test-helper";

describe('Blog (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const validBlogData = {
    name: 'Valid Name',
    description: 'Valid description',
    websiteUrl: 'https://example.com',
  };

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

  describe('Super Admin BlogController', () => {
    it('Correct blog creation; POST /api/sa/blogs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: validBlogData.name,
        description: validBlogData.description,
        websiteUrl: validBlogData.websiteUrl,
      });
    });
    it('Incorrect blog creation; POST /api/sa/blogs', async () => {
      const incorrectResponse1 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send({
          ...validBlogData,
          name: '',
        })
        .expect(HttpStatus.BAD_REQUEST);

      const incorrectResponse2 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send({
          ...validBlogData,
          description: '',
        })
        .expect(HttpStatus.BAD_REQUEST);

      const incorrectResponse3 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send({
          ...validBlogData,
          websiteUrl: '',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('Creating a blog by an unauthorized user; POST /api/sa/blogs', async () => {
      const incorrectResponse1 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .send(validBlogData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it('Getting all blogs with pagination; GET /api/sa/blogs', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const response2 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const response3 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send({ ...validBlogData, name: 'Search Blog' })
        .expect(HttpStatus.CREATED);

      const getResponse = await request(app.getHttpServer())
        .get('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        pagesCount: expect.any(Number),
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: expect.any(Array),
      });

      expect(getResponse.body.items).toHaveLength(3);

      expect(getResponse.body.items[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        websiteUrl: expect.any(String),
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });

      const getResponse2 = await request(app.getHttpServer())
        .get('/api/sa/blogs')
        .query({
          searchNameTerm: 'Search Blog',
          pageNumber: 1,
          pageSize: 5,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(getResponse2.body).toMatchObject({
        pagesCount: 1,
        page: 1,
        pageSize: 5,
        totalCount: 1,
        items: expect.any(Array),
      });

      expect(getResponse2.body.items).toHaveLength(1);
      expect(getResponse2.body.items[0].name).toBe('Search Blog');
    });
    it('Correct blog update; PUT /api/sa/blogs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const blogId = response.body.id;

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .send({ ...validBlogData, name: 'Search Blog' })
        .expect(HttpStatus.NO_CONTENT);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: blogId,
        name: 'Search Blog',
        description: validBlogData.description,
        websiteUrl: validBlogData.websiteUrl,
        isMembership: expect.any(Boolean),
        createdAt: expect.any(String),
      });
    });
    it('Incorrect blog update; PUT /api/sa/blogs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const blogId = response.body.id;

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .send({ ...validBlogData, name: ' ' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .send({ ...validBlogData, description: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .send({ ...validBlogData, websiteUrl: '' })
        .expect(HttpStatus.BAD_REQUEST);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: blogId,
        name: validBlogData.name,
        description: validBlogData.description,
        websiteUrl: validBlogData.websiteUrl,
        isMembership: expect.any(Boolean),
        createdAt: expect.any(String),
      });
    });
    it('Blog update by an unauthorized user; PUT /api/sa/blogs/:blogId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const blogId = response.body.id;

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}`)
        .send({
          ...validBlogData,
          name: 'Search Blog',
          description: 'aaaaaaaaaaaaaaaaaaaaasdasdasd',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: blogId,
        name: validBlogData.name,
        description: validBlogData.description,
        websiteUrl: validBlogData.websiteUrl,
        isMembership: expect.any(Boolean),
        createdAt: expect.any(String),
      });
    });
    it('Deleting a blog; PUT /api/sa/blogs/:blogId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const blogId = response.body.id;

      await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Public BlogController', () => {
    it('Getting a blog by ID; GET /api/blogs/:blogId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const blogId = response.body.id;

      const getResponse = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: expect.any(String),
        name: validBlogData.name,
        description: validBlogData.description,
        websiteUrl: validBlogData.websiteUrl,
      });

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      const getResponse2 = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('Getting all blogs with pagination; GET /api/blogs', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const response2 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      const response3 = await request(app.getHttpServer())
        .post('/api/sa/blogs')
        .auth('admin', 'qwerty')
        .send({ ...validBlogData, name: 'Search Blog' })
        .expect(HttpStatus.CREATED);

      const getResponse = await request(app.getHttpServer())
        .get('/api/blogs')
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        pagesCount: expect.any(Number),
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: expect.any(Array),
      });

      expect(getResponse.body.items).toHaveLength(3);

      expect(getResponse.body.items[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        websiteUrl: expect.any(String),
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });

      const getResponse2 = await request(app.getHttpServer())
        .get('/api/blogs')
        .query({
          searchNameTerm: 'Search Blog',
          pageNumber: 1,
          pageSize: 5,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(getResponse2.body).toMatchObject({
        pagesCount: 1,
        page: 1,
        pageSize: 5,
        totalCount: 1,
        items: expect.any(Array),
      });

      expect(getResponse2.body.items).toHaveLength(1);
      expect(getResponse2.body.items[0].name).toBe('Search Blog');
    });
  });
});
