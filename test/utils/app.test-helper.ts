import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {AppModule} from "../../src/app.module";
import {appSetup} from "../../src/setup/app.setup";

export const initApp = async (): Promise<{ app: INestApplication; dataSource: DataSource }> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  appSetup(app);
  await app.init();

  const dataSource = moduleFixture.get<DataSource>(getDataSourceToken());

  await clearDB(dataSource);

  return { app, dataSource };
};


export const clearDB = async (dataSource: DataSource) => {
  await dataSource.query(`
    CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
    DECLARE
        statements CURSOR FOR
            SELECT tablename FROM pg_tables
            WHERE tableowner = username AND schemaname = 'public';
    BEGIN
        FOR stmt IN statements LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE';
        END LOOP;
    END;
    $$ LANGUAGE plpgsql;
    
    SELECT truncate_tables('postgres');
  `);
};
