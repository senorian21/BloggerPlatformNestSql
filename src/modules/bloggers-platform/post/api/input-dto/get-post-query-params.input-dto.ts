import { PostSortBy } from './post-sort-by';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';

export class GetPostQueryParams extends BaseQueryParams {
  @IsEnum(PostSortBy)
  sortBy = PostSortBy.CreatedAt;
}
