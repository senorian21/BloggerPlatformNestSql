import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogSortBy } from './blog-sort-by';
import { IsOptional, IsString } from 'class-validator';

export class GetBlogsQueryParams extends BaseQueryParams {
  @IsString()
  @IsOptional()
  sortBy = BlogSortBy.CreatedAt;

  @IsString() // Разрешает строку или null
  @IsOptional()
  searchNameTerm: string | null = null;
}
