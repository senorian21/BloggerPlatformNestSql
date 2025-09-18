import { Module } from '@nestjs/common';
import { SAQuestionsController } from './questions/api/sa-questions.controller';
import { createQuestionUseCase } from './questions/application/usecases/create-question.usecase';
import { QuestionRepository } from './questions/infrastructure/question.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './questions/domain/question.entity';
import {GetQuestionByIdQueryHandler} from "./questions/application/queries/get-question-by-id";
import {QuestionQueryRepository} from "./questions/infrastructure/query/question.query-repository";

const commandHandlers = [createQuestionUseCase];

const queryHandlers = [GetQuestionByIdQueryHandler]

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  controllers: [SAQuestionsController],
  providers: [...commandHandlers, ...queryHandlers, QuestionRepository, QuestionQueryRepository],
  exports: [],
})
export class QuizGameModule {}
