import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetQuestionQueryParams } from '../../api/input-dto/get-queston-query-params.input-dto';
import { QuestionQueryRepository } from '../../infrastructure/query/question.query-repository';

export class GetAllQuestionQuery {
  constructor(public params: GetQuestionQueryParams) {}
}

@QueryHandler(GetAllQuestionQuery)
export class GetAllQuestionQueryHandler
  implements
    IQueryHandler<GetAllQuestionQuery, PaginatedViewDto<QuestionViewDto[]>>
{
  constructor(private questionQueryRepository: QuestionQueryRepository) {}

  async execute(
    query: GetAllQuestionQuery,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return this.questionQueryRepository.getAll(query.params);
  }
}
