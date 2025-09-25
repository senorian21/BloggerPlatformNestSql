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
import { Player } from './player/domain/player.entity';
import { Answer } from './answer/domain/answer.entity';
import { Game } from './game/domain/game.entity';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { PlayerRepository } from './player/infrastructure/player.repository';
import { GameQuestion } from './questions/domain/game-question.entity';
import { pairGameQuizController } from './game/api/pair-game-quiz.controller';
import { JoinGameUseCase } from './game/application/usecases/join-game.usecase';
import { GameRepository } from './game/infrastructure/game.repository';
import { GameQueryRepository } from './game/infrastructure/query/game.query-repository';
import { GetGameByIdQueryHandler } from './game/application/queries/get-game-by-id.query-handle';
import { AnswerRepository } from './answer/infrastructure/answer.repository';
import { AnswerUseCase } from './game/application/usecases/answer.usecase';
import { AnswerQueryRepository } from './answer/infrastructure/query/answer.query-repository';
import { GetAnswerByIdQueryHandler } from './answer/application/query/get-answer-by-id.query-handle';

const commandHandlers = [
  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  DeleteQuestionUseCase,
  PublishQuestionUseCase,
  JoinGameUseCase,
  AnswerUseCase,
];

const queryHandlers = [
  GetQuestionByIdQueryHandler,
  GetAllQuestionQueryHandler,
  GetGameByIdQueryHandler,
  GetAnswerByIdQueryHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Player, Answer, Game, GameQuestion]),
    UserAccountsModule,
  ],
  controllers: [SAQuestionsController, pairGameQuizController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    QuestionRepository,
    QuestionQueryRepository,
    PlayerRepository,
    GameRepository,
    GameQueryRepository,
    AnswerRepository,
    AnswerQueryRepository,
  ],
  exports: [],
})
export class QuizGameModule {}
