import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { UserSortBy } from './user-sort-by';
import { IsEnum, IsOptional } from 'class-validator';

export class GetUserQueryParams extends BaseQueryParams {
  sortBy = UserSortBy.CreatedAt;

  @IsOptional()
  searchLoginTerm: string | null = null;

  @IsOptional()
  searchEmailTerm: string | null = null;
}
