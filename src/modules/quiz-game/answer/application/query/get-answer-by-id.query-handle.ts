import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PlayerAnswerDto } from '../../api/view-dto/answer.view-dto';
import { AnswerQueryRepository } from '../../infrastructure/query/answer.query-repository';

export class GetAnswerByIdQuery {
  constructor(
    public answerId: number,
    public questionId: number,
  ) {}
}

@QueryHandler(GetAnswerByIdQuery)
export class GetAnswerByIdQueryHandler
  implements IQueryHandler<GetAnswerByIdQuery, PlayerAnswerDto>
{
  constructor(private answerQueryRepository: AnswerQueryRepository) {}

  async execute(query: GetAnswerByIdQuery): Promise<PlayerAnswerDto> {
    return this.answerQueryRepository.findPlayerAnswerById(
      query.answerId,
      query.questionId,
    );
  }
}
