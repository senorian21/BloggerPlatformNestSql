import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogSortBy } from './blog-sort-by';

import { IsString, IsOptional, IsIn } from 'class-validator';

export class GetBlogsQueryParams extends BaseQueryParams {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(BlogSortBy))
  sortBy = BlogSortBy.CreatedAt;

  @IsString()
  @IsOptional()
  searchNameTerm: string | null = null;
}
