import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from '../../dto/questions.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Question } from '../../domain/question.entity';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class UpdateQuestionCommand {
  constructor(
    public dto: UpdateQuestionDto,
    public questionId: number,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand, void>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute({ dto, questionId }: UpdateQuestionCommand): Promise<void> {
    const question = await this.questionRepository.findByIdOrFail(questionId);
    question.update(dto);
    await this.questionRepository.save(question);
  }
}
