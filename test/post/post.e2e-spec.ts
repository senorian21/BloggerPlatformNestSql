import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initApp } from '../utils/app.test-helper';

describe('BlogController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
  });

  beforeEach(async () => {
    await dataSource.query(`SELECT truncate_tables('postgres');`);
  });

  afterAll(async () => {
    await app.close();
  });
});
