import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateQuestionDto } from './input-dto/questions.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/usecases/create-question.usecase';
import { GetQuestionByIdQuery } from '../application/queries/get-question-by-id';
import { QuestionViewDto } from '../../../bloggers-platform/blog/api/view-dto/question.view-dto';

@Controller('sa/quiz/questions')
@UseGuards(BasicAuthGuard)
export class SAQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createQuestion(@Body() dto: CreateQuestionDto) {
    const questionId = await this.commandBus.execute<
      CreateQuestionCommand,
      number
    >(new CreateQuestionCommand(dto));

    return this.queryBus.execute<GetQuestionByIdQuery, QuestionViewDto>(
      new GetQuestionByIdQuery(questionId),
    );
  }
}
