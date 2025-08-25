import { Injectable } from '@nestjs/common';
import { GetUserQueryParams } from '../../api/input-dto/get-user-query-params.input-dto';
import { plainToClass } from 'class-transformer';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {Brackets, DataSource, Repository} from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { User } from '../../domain/user.entity';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}
    async getAll(
        query: GetUserQueryParams,
    ): Promise<PaginatedViewDto<UserViewDto[]>> {
        const queryParams = plainToClass(GetUserQueryParams, query);

        const pageNumber = Math.max(1, Number(queryParams.pageNumber) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(queryParams.pageSize) || 10));
        const skip = (pageNumber - 1) * pageSize;

        const allowedSortFields = ['createdAt', 'login', 'email'] as const;
        const sortBy = allowedSortFields.includes(queryParams.sortBy as any)
            ? (queryParams.sortBy as (typeof allowedSortFields)[number])
            : 'createdAt';
        const sortDirection: 'ASC' | 'DESC' =
            queryParams.sortDirection === 'asc' ? 'ASC' : 'DESC';

        const qb = this.usersRepo
            .createQueryBuilder('u')
            .select([
                'u.id::TEXT AS id',
                'u.login AS login',
                'u.email AS email',
                'u.createdAt AS "createdAt"',
            ])
            .where('u.deletedAt IS NULL');

        if (queryParams.searchEmailTerm?.trim() || queryParams.searchLoginTerm?.trim()) {
            qb.andWhere(
                new Brackets((qb1) => {
                    if (queryParams.searchEmailTerm?.trim()) {
                        qb1.orWhere('u.email ILIKE :email', {
                            email: `%${queryParams.searchEmailTerm.trim()}%`,
                        });
                    }
                    if (queryParams.searchLoginTerm?.trim()) {
                        qb1.orWhere('u.login ILIKE :login', {
                            login: `%${queryParams.searchLoginTerm.trim()}%`,
                        });
                    }
                }),
            );
        }

        // ВАЖНО: для строк сортируем с COLLATE "C", для дат — без него
        const orderExpr =
            sortBy === 'login' || sortBy === 'email'
                ? `u.${sortBy} COLLATE "C"`
                : `u.${sortBy}`;

        qb.orderBy(orderExpr, sortDirection).skip(skip).take(pageSize);

        const users = await qb.getRawMany<UserViewDto>();

        const countQb = this.usersRepo.createQueryBuilder('u').where('u.deletedAt IS NULL');

        if (queryParams.searchEmailTerm?.trim() || queryParams.searchLoginTerm?.trim()) {
            countQb.andWhere(
                new Brackets((qb1) => {
                    if (queryParams.searchEmailTerm?.trim()) {
                        qb1.orWhere('u.email ILIKE :email', {
                            email: `%${queryParams.searchEmailTerm.trim()}%`,
                        });
                    }
                    if (queryParams.searchLoginTerm?.trim()) {
                        qb1.orWhere('u.login ILIKE :login', {
                            login: `%${queryParams.searchLoginTerm.trim()}%`,
                        });
                    }
                }),
            );
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
        'u.createdAt AS "createdAt"',
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
