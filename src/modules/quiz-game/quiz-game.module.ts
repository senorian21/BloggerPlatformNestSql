import { Module } from '@nestjs/common';
import { SAQuestionsController } from './questions/api/sa-questions.controller';
import { CreateQuestionUseCase } from './questions/application/usecases/create-question.usecase';
import { QuestionRepository } from './questions/infrastructure/question.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './questions/domain/question.entity';
import { GetQuestionByIdQueryHandler } from './questions/application/queries/get-question-by-id';
import { QuestionQueryRepository } from './questions/infrastructure/query/question.query-repository';
import { UpdateQuestionUseCase } from './questions/application/usecases/update-question.usecase';
import { DeleteQuestionUseCase } from './questions/application/usecases/delete-question.usecase';
import { PublishQuestionUseCase } from './questions/application/usecases/publish-question.usecase';
import { GetAllQuestionQueryHandler } from './questions/application/queries/get-all-question.query-handler';

const commandHandlers = [
  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  DeleteQuestionUseCase,
  PublishQuestionUseCase,
];

const queryHandlers = [GetQuestionByIdQueryHandler, GetAllQuestionQueryHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  controllers: [SAQuestionsController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    QuestionRepository,
    QuestionQueryRepository,
  ],
  exports: [],
})
export class QuizGameModule {}
