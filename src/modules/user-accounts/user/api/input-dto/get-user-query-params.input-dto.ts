import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { UserSortBy } from './user-sort-by';

export class GetUserQueryParams extends BaseQueryParams {
  sortBy = UserSortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}
