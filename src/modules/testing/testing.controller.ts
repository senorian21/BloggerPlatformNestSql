import { Connection } from 'mongoose';
import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
    @InjectDataSource()
    protected datasource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    // Получаем список всех таблиц в схеме public
    const tables = await this.datasource.query(
      'SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename NOT LIKE $2',
      ['public', 'typeorm_%'], // Исключаем служебные таблицы TypeORM
    );

    // Формируем запросы с RESTART IDENTITY для сброса счетчиков
    const truncateQueries = tables.map(
      (table) =>
        `TRUNCATE TABLE "public"."${table.tablename}" RESTART IDENTITY CASCADE;`,
    );

    // Выполняем в транзакции
    await this.datasource.transaction(async (queryRunner) => {
      await queryRunner.query('SET CONSTRAINTS ALL DEFERRED'); // Откладываем проверку FK
      for (const query of truncateQueries) {
        await queryRunner.query(query);
      }
    });

    return { status: 'succeeded' };
  }
}
