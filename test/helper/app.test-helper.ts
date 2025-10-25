import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { NodemailerService } from '../../src/modules/user-accounts/adapters/nodemeiler/nodemeiler.service';
import { GameCronService } from '../../src/modules/quiz-game/game/application/service/cron-game.service';

export const initApp = async (): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(NodemailerService)
    .useValue({
      sendEmail: jest.fn().mockResolvedValue(undefined), // мок метода
    })
    .overrideProvider(GameCronService)
    .useValue({ checkGames: jest.fn() })
    .compile();

  const app = moduleFixture.createNestApplication();
  appSetup(app);
  await app.init();

  const dataSource = moduleFixture.get<DataSource>(getDataSourceToken());

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
  `);

  await clearDB(dataSource);

  return { app, dataSource };
};

export const clearDB = async (dataSource: DataSource) => {
  await dataSource.query(`SELECT truncate_tables('postgres');`);
};
