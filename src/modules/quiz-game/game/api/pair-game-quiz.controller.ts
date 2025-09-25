import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/user.decorator';
import { UserContextDto } from '../../../user-accounts/auth/dto/user-context.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JoinGameCommand } from '../application/usecases/join-game.usecase';
import { GetGameByIdQuery } from '../application/queries/get-game-by-id.query-handle';
import { GameViewDto } from './view-dto/game.view-dto';
import { AnswerCommand } from '../application/usecases/answer.usecase';
import { answerInputDto } from './input-dto/answer.input-dto';
import { GetAnswerByIdQuery } from '../../answer/application/query/get-answer-by-id.query-handle';
import { PlayerAnswerDto } from '../../answer/api/view-dto/answer.view-dto';
import { GetGameByIdForPlayerQuery } from '../application/queries/get-game-by-id-for-player.query-handle';

@Controller('pair-game-quiz/pairs')
export class pairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('connection')
  @UseGuards(JwtAuthGuard)
  async connectUser(@ExtractUserFromRequest() user: UserContextDto) {
    const gameId = await this.commandBus.execute<JoinGameCommand, string>(
      new JoinGameCommand(user.id),
    );
    return this.queryBus.execute<GetGameByIdQuery, GameViewDto>(
      new GetGameByIdQuery(gameId),
    );
  }

  @Post('my-current/answers')
  @UseGuards(JwtAuthGuard)
  async answer(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: answerInputDto,
  ) {
    const resultId = await this.commandBus.execute<
      AnswerCommand,
      { answerId: number; questionId: number }
    >(new AnswerCommand(user.id, dto.answer));
    return this.queryBus.execute<GetAnswerByIdQuery, PlayerAnswerDto>(
      new GetAnswerByIdQuery(resultId.answerId, resultId.questionId),
    );
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async getGameById(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('id') gameId: string,
  ) {
    return this.queryBus.execute<GetGameByIdForPlayerQuery, GameViewDto>(
      new GetGameByIdForPlayerQuery(gameId, user.id),
    );
  }
}
