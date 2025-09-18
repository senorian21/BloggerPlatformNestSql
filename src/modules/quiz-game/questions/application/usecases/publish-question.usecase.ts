import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { PublishQuestionDto } from '../../dto/publish-question.dto';

export class PublishQuestionCommand {
  constructor(
    public dto: PublishQuestionDto,
    public questionId: number,
  ) {}
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  implements ICommandHandler<PublishQuestionCommand, void>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute({ dto, questionId }: PublishQuestionCommand): Promise<void> {
    const question = await this.questionRepository.findByIdOrFail(questionId);
    question.publish(dto);
    await this.questionRepository.save(question);
  }
}
