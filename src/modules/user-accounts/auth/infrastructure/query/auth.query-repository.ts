import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Session } from '../../../security/domain/session.entity';
import { User } from '../../../user/domain/user.entity';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectDataSource()
    protected datasource: DataSource,

    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async me(id: number) {
    const user = await this.sessionRepo.manager
      .createQueryBuilder(User, 'u')
      .select([
        'u.email AS email',
        'u.login AS login',
        'u.id::text AS "userId"',
      ])
      .where('u.id = :id', { id })
      .getRawOne();

    return user ?? null;
  }
}
