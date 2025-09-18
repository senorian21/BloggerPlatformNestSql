import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuestionViewDto } from '../../../../bloggers-platform/blog/api/view-dto/question.view-dto';
import { QuestionQueryRepository } from '../../infrastructure/query/question.query-repository';

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
