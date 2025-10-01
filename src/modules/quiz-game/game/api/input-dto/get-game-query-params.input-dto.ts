import { IsOptional } from 'class-validator';

import { GameSortBy } from './game-sort-by';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetGamesQueryParams extends BaseQueryParams {
  @IsOptional()
  sortBy: GameSortBy = GameSortBy.PairCreatedDate;
}
