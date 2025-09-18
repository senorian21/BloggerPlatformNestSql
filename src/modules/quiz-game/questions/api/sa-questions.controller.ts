import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from './input-dto/questions.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/usecases/create-question.usecase';
import { GetQuestionByIdQuery } from '../application/queries/get-question-by-id';
import { UpdateQuestionCommand } from '../application/usecases/update-question.usecase';
import { DeleteQuestionCommand } from '../application/usecases/delete-question.usecase';
import { PublishQuestionDto } from './input-dto/publish-question.input-dto';
import { PublishQuestionCommand } from '../application/usecases/publish-question.usecase';
import { GetQuestionQueryParams } from './input-dto/get-queston-query-params.input-dto';
import { GetAllQuestionQuery } from '../application/queries/get-all-question.query-handler';
import { QuestionViewDto } from './view-dto/question.view-dto';

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

  @Put('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    await this.commandBus.execute<UpdateQuestionCommand, void>(
      new UpdateQuestionCommand(dto, questionId),
    );
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    await this.commandBus.execute<DeleteQuestionCommand, void>(
      new DeleteQuestionCommand(id),
    );
  }

  @Put('/:id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async publishQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishQuestionDto,
  ) {
    await this.commandBus.execute<PublishQuestionCommand, void>(
      new PublishQuestionCommand(dto, id),
    );
  }

  @Get()
  async getAllQuestions(@Query() query: GetQuestionQueryParams) {
    return await this.queryBus.execute<GetAllQuestionQuery, QuestionViewDto[]>(
      new GetAllQuestionQuery(query),
    );
  }
}
