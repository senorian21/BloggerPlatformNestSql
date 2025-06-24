import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { CommentSortBy } from './comment-sort-by';

export class GetCommentQueryParams extends BaseQueryParams {
  sortBy = CommentSortBy.CreatedAt;
}
