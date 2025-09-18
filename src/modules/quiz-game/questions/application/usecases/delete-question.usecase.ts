import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class DeleteQuestionCommand {
  constructor(public questionId: number) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand, void>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute({ questionId }: DeleteQuestionCommand): Promise<void> {
    await this.questionRepository.findByIdOrFail(questionId);
    await this.questionRepository.softDelete(questionId);
  }
}
