import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuestionQueryRepository } from '../../infrastructure/query/question.query-repository';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';

export class GetQuestionByIdQuery {
  constructor(public id: number) {}
}

@QueryHandler(GetQuestionByIdQuery)
export class GetQuestionByIdQueryHandler
  implements IQueryHandler<GetQuestionByIdQuery, QuestionViewDto>
{
  constructor(private questionQueryRepository: QuestionQueryRepository) {}

  async execute(query: GetQuestionByIdQuery): Promise<QuestionViewDto> {
    return this.questionQueryRepository.getByIdOrNotFoundFail(query.id);
  }
}
