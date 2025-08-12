import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectDataSource()
    protected datasource: DataSource,
  ) {}

  async me(id: number) {
    const users = await this.datasource.query(
      `
      SELECT 
        email, 
        login, 
        id::text AS "userId"  -- Преобразуем в строку И сохраняем регистр через кавычки
      FROM "User" 
      WHERE id = $1`,
      [id],
    );

    return users.length > 0 ? users[0] : null;
  }
}
