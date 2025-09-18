import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { QuestionSortBy } from './question-sort-by';

export class GetQuestionQueryParams extends BaseQueryParams {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(QuestionSortBy))
  sortBy = QuestionSortBy.CreatedAt;

  @IsString()
  @IsOptional()
  bodySearchTerm: string | null = null;

  @IsString()
  @IsOptional()
  publishedStatus: string = 'all';
}
