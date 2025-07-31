import { Injectable } from '@nestjs/common';
import { GetUserQueryParams } from '../../api/input-dto/get-user-query-params.input-dto';
import { plainToClass } from 'class-transformer';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class UserQueryRepository {
  constructor(@InjectDataSource() protected datasource: DataSource) {}
  async getAll(
    query: GetUserQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const queryParams = plainToClass(GetUserQueryParams, query);

    const pageNumber = Math.max(1, Number(queryParams.pageNumber) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(queryParams.pageSize) || 10),
    );
    const skip = (pageNumber - 1) * pageSize;

    const allowedSortFields = ['createdAt'];

    const sortBy = allowedSortFields.includes(queryParams.sortBy)
      ? queryParams.sortBy
      : 'createdAt';

    const sortDirection = queryParams.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const baseConditions = [`"deletedAt" IS NULL`];
    const searchConditions: string[] = [];
    const params: any[] = [];

    if (queryParams.searchEmailTerm?.trim()) {
      searchConditions.push(`LOWER(email) LIKE LOWER($${params.length + 1})`);
      params.push(`%${queryParams.searchEmailTerm.trim()}%`);
    }

    if (queryParams.searchLoginTerm?.trim()) {
      searchConditions.push(`LOWER(login) LIKE LOWER($${params.length + 1})`);
      params.push(`%${queryParams.searchLoginTerm.trim()}%`);
    }

    let whereClause = baseConditions.join(' AND ');

    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(' OR ')})`;
    }

    const dataQuery = `
    SELECT 
      id::text AS id,
      login, 
      email, 
      "createdAt" 
    FROM "User"
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

    params.push(pageSize, skip);

    const users = await this.datasource.query(dataQuery, params);

    const countQuery = `
    SELECT COUNT(*)::int AS total_count 
    FROM "User" 
    ${whereClause ? `WHERE ${whereClause}` : ''}
  `;
    const countResult = await this.datasource.query(
      countQuery,
      params.slice(0, -2),
    );
    const totalCount = countResult[0]?.total_count || 0;

    return PaginatedViewDto.mapToView({
      items: users,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async getByIdOrNotFoundFail(id: number) {
    const result = await this.datasource.query(
      `SELECT
           id::TEXT AS "id",
           login,
           email,
           "createdAt"
         FROM "User"
         WHERE id = $1 AND "deletedAt" IS NULL`,
      [id],
    );

    if (result.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return result[0];
  }
}
