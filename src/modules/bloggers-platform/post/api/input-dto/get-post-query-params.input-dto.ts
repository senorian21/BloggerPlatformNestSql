import { PostSortBy } from './post-sort-by';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetPostQueryParams extends BaseQueryParams {
  sortBy = PostSortBy.CreatedAt;
}
