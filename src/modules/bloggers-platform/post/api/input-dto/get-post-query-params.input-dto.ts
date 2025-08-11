import { PostSortBy } from './post-sort-by';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetPostQueryParams extends BaseQueryParams {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(PostSortBy))
  sortBy = PostSortBy.CreatedAt;
}
