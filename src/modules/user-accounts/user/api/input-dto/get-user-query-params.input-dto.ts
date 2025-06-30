import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { UserSortBy } from './user-sort-by';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetUserQueryParams extends BaseQueryParams {
  @IsEnum(UserSortBy)
  sortBy = UserSortBy.CreatedAt;

  @IsString()
  @IsOptional()
  searchLoginTerm: string | null = null;

  @IsString()
  @IsOptional()
  searchEmailTerm: string | null = null;
}
