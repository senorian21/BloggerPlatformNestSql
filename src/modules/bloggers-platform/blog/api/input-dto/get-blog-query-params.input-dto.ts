import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogSortBy } from './blog-sort-by';

export class GetBlogsQueryParams extends BaseQueryParams {
  sortBy = BlogSortBy.CreatedAt;
  searchNameTerm: string | null = null;
}
