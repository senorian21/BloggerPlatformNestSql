import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initApp } from '../utils/app.test-helper';
import { BlogsTestHelper } from '../blog/blogs.test-helper';
import request from 'supertest';

describe('Post (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let blogsHelper: BlogsTestHelper;

  const validBlogData = {
    name: 'Valid Name',
    description: 'Valid description',
    websiteUrl: 'https://example.com',
  };

  const validPostData = {
    title: 'Valid title',
    shortDescription: 'Valid shortDescription',
    content: 'Valid content',
  };

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    dataSource = init.dataSource;
    blogsHelper = new BlogsTestHelper(app);
  });

  beforeEach(async () => {
    await dataSource.query(`SELECT truncate_tables('postgres');`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Super Admin BlogController POST', () => {
    it('✅Correct post creation; POST /api/sa/blogs/:blogId/posts', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      const createPostResponse = await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      expect(createPostResponse.body).toMatchObject({
        id: expect.any(String),
        title: validPostData.title,
        shortDescription: validPostData.shortDescription,
        content: validPostData.content,
        blogId: blogId,
        blogName: validBlogData.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: expect.any(Array),
        },
      });

      expect(
        createPostResponse.body.extendedLikesInfo.newestLikes,
      ).toHaveLength(0);
    });
    it('❌Incorrect post creation; POST /api/sa/blogs/:blogId/posts', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, shortDescription: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, content: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/999/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .send(validPostData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it('✅Getting all posts by blog with pagination; GET /api/blogs/:blogId/posts', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Second Post' })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Third Post' })
        .expect(HttpStatus.CREATED);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK);

      expect(getResponse.body.totalCount).toBe(3);
      expect(getResponse.body.items).toHaveLength(3);

      const getResponsePage1 = await request(app.getHttpServer())
        .get(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .query({ pageNumber: 1, pageSize: 2 })
        .expect(HttpStatus.OK);

      expect(getResponsePage1.body.totalCount).toBe(3);
      expect(getResponsePage1.body.items).toHaveLength(2);

      const getResponsePage2 = await request(app.getHttpServer())
        .get(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .query({ pageNumber: 2, pageSize: 2 })
        .expect(HttpStatus.OK);

      expect(getResponsePage2.body.totalCount).toBe(3);
      expect(getResponsePage2.body.items).toHaveLength(1);
    });
    it('✅Correct post update; PUT /api/sa/blogs/:blogId/posts/:postId', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      const createPostResponse = await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      const postId = createPostResponse.body.id;

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Update Post' })
        .expect(HttpStatus.NO_CONTENT);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: postId,
        title: 'Update Post',
        shortDescription: validPostData.shortDescription,
        content: validPostData.content,
        blogId: blogId,
        blogName: validBlogData.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: expect.any(Array),
        },
      });
    });
    it('❌Incorrect post update; PUT /api/sa/blogs/:blogId/posts/:postId', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      const createPostResponse = await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      const postId = createPostResponse.body.id;

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, shortDescription: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, content: '' })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .send(validPostData)
        .expect(HttpStatus.UNAUTHORIZED);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/999/posts/${postId}`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .put(`/api/sa/blogs/${blogId}/posts/999`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.NOT_FOUND);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: postId,
        title: validPostData.title, // осталось прежним
        shortDescription: validPostData.shortDescription,
        content: validPostData.content,
        blogId: blogId,
        blogName: validBlogData.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: expect.any(Array),
        },
      });
    });
    it('✅Correct post delete; PUT /api/sa/blogs/:blogId/posts/:postId', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      const createPostResponse = await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      const postId = createPostResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('❌Incorrect post delete; PUT /api/sa/blogs/:blogId/posts/:postId', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      const createPostResponse = await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      const postId = createPostResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .expect(HttpStatus.UNAUTHORIZED);

      await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}/posts/999`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('Public BlogController POST', () => {
    it('✅Getting all posts by blog with pagination; GET /api/blogs/:blogId/posts', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Second Post' })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Third Post' })
        .expect(HttpStatus.CREATED);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}/posts`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.totalCount).toBe(3);
      expect(getResponse.body.items).toHaveLength(3);

      const getResponsePage1 = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}/posts`)
        .query({ pageNumber: 1, pageSize: 2 })
        .expect(HttpStatus.OK);

      expect(getResponsePage1.body.totalCount).toBe(3);
      expect(getResponsePage1.body.items).toHaveLength(2);

      const getResponsePage2 = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}/posts`)
        .query({ pageNumber: 2, pageSize: 2 })
        .expect(HttpStatus.OK);

      expect(getResponsePage2.body.totalCount).toBe(3);
      expect(getResponsePage2.body.items).toHaveLength(1);
    });
    it('✅ Getting all posts; GET /api/posts', async () => {
      const createResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createResponse.body.id;

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Second Post' })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send({ ...validPostData, title: 'Third Post' })
        .expect(HttpStatus.CREATED);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/posts`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: expect.any(Array),
      });

      expect(getResponse.body.items).toHaveLength(3);

      const getResponsePage1 = await request(app.getHttpServer())
        .get(`/api/posts`)
        .query({ pageNumber: 1, pageSize: 2 })
        .expect(HttpStatus.OK);

      expect(getResponsePage1.body.totalCount).toBe(3);
      expect(getResponsePage1.body.items).toHaveLength(2);

      const getResponsePage2 = await request(app.getHttpServer())
        .get(`/api/posts`)
        .query({ pageNumber: 2, pageSize: 2 })
        .expect(HttpStatus.OK);

      expect(getResponsePage2.body.totalCount).toBe(3);
      expect(getResponsePage2.body.items).toHaveLength(1);
    });
    it('✅ Getting a post by ID; GET /api/posts/:postId', async () => {
      const createBlogResponse = await blogsHelper.createBlog(validBlogData);
      const blogId = createBlogResponse.body.id;

      const createPostResponse = await request(app.getHttpServer())
        .post(`/api/sa/blogs/${blogId}/posts`)
        .auth('admin', 'qwerty')
        .send(validPostData)
        .expect(HttpStatus.CREATED);

      const postId = createPostResponse.body.id;

      const getResponse = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: postId,
        title: validPostData.title,
        shortDescription: validPostData.shortDescription,
        content: validPostData.content,
        blogId: blogId,
        blogName: validBlogData.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: expect.any(Array),
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/sa/blogs/${blogId}/posts/${postId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
