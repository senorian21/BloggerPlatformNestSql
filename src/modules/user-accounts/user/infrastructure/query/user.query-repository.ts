import { Injectable } from '@nestjs/common';
import { GetUserQueryParams } from '../../api/input-dto/get-user-query-params.input-dto';
import { plainToClass } from 'class-transformer';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import {InjectDataSource, InjectRepository} from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import {User} from "../../domain/user.entity";

@Injectable()
export class UserQueryRepository {
  constructor(
      @InjectDataSource()
      protected datasource: DataSource,

      @InjectRepository(User)
      private usersRepo: Repository<User>,
  ) {}
  async getAll(
      query: GetUserQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const queryParams = plainToClass(GetUserQueryParams, query);

    const pageNumber = Math.max(1, Number(queryParams.pageNumber) || 1);
    const pageSize =
        Math.min(100, Math.max(1, Number(queryParams.pageSize) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = ['createdAt'];
    const sortBy = allowedSortFields.includes(queryParams.sortBy)
        ? queryParams.sortBy
        : 'createdAt';
    const sortDirection = queryParams.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const qb = this.usersRepo
        .createQueryBuilder('u')
        .select([
          'u.id::TEXT AS id',
          'u.login AS login',
          'u.email AS email',
          'u.createdAt AS createdAt',
        ])
        .where('u.deletedAt IS NULL');

    if (queryParams.searchEmailTerm?.trim()) {
      qb.andWhere('LOWER(u.email) LIKE LOWER(:email)', {
        email: `%${queryParams.searchEmailTerm.trim()}%`,
      });
    }

    if (queryParams.searchLoginTerm?.trim()) {
      qb.andWhere('LOWER(u.login) LIKE LOWER(:login)', {
        login: `%${queryParams.searchLoginTerm.trim()}%`,
      });
    }

    qb.orderBy(`u.${sortBy}`, sortDirection as 'ASC' | 'DESC')
        .skip(skip)
        .take(pageSize);

    const users = await qb.getRawMany();

    const countQb = this.usersRepo
        .createQueryBuilder('u')
        .where('u.deletedAt IS NULL');

    if (queryParams.searchEmailTerm?.trim()) {
      countQb.andWhere('LOWER(u.email) LIKE LOWER(:email)', {
        email: `%${queryParams.searchEmailTerm.trim()}%`,
      });
    }

    if (queryParams.searchLoginTerm?.trim()) {
      countQb.andWhere('LOWER(u.login) LIKE LOWER(:login)', {
        login: `%${queryParams.searchLoginTerm.trim()}%`,
      });
    }

    const totalCount = await countQb.getCount();

    return PaginatedViewDto.mapToView({
      items: users,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async getByIdOrNotFoundFail(id: number) {
    const result = await this.usersRepo
        .createQueryBuilder('u')
        .select([
          'u.id::TEXT AS id',
          'u.login AS login',
          'u.email AS email',
          'u.createdAt AS createdAt',
        ])
        .where('u.id = :id', { id })
        .andWhere('u.deletedAt IS NULL')
        .getRawOne();

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return result;
  }
}
