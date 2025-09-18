import { CreateQuestionDto } from '../../dto/questions.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Question } from '../../domain/question.entity';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class CreateQuestionCommand {
  constructor(public dto: CreateQuestionDto) {}
}

@CommandHandler(CreateQuestionCommand)
export class createQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand, number>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute({ dto }: CreateQuestionCommand): Promise<number> {
    const question = Question.create(dto);
    await this.questionRepository.save(question);
    return question.id;
  }
}
