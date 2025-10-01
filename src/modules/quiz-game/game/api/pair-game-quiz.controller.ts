import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { GetActiveGameForPlayerQuery } from '../application/queries/get-active-game-for-player.query-handle';
import { StatisticGameCommand } from '../application/usecases/statistic-game.usecase';
import { GetAllGamesQuery } from '../application/queries/get-all-game-by-id.query-handle';
import { GetGamesQueryParams } from './input-dto/get-game-query-params.input-dto';
import { GetTopUsersQueryParams } from './input-dto/get-top-user-query-params.input-dto';
import { GetTopUsersQuery } from '../../player/application/queries/get-top-users.query-handle';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { TopUserViewDto } from '../../player/api/view-dto/top-user.view-dto';

@Controller('pair-game-quiz')
export class pairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('pairs/my')
  @UseGuards(JwtAuthGuard)
  async getAllGameByUser(
    @ExtractUserFromRequest() user: UserContextDto,
    @Query() query: GetGamesQueryParams,
  ) {
    return this.queryBus.execute<
      GetAllGamesQuery,
      {
        pagesCount: number;
        page: number;
        pageSize: number;
        totalCount: number;
        items: GameViewDto[];
      }
    >(new GetAllGamesQuery(user.id, query));
  }

  @Get('pairs/top-users')
  async topUsers(@Query() query: GetTopUsersQueryParams) {
    return this.queryBus.execute<
      GetTopUsersQuery,
      PaginatedViewDto<TopUserViewDto[]>
    >(new GetTopUsersQuery(query));
  }

  @Post('pairs/connection')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async connectUser(@ExtractUserFromRequest() user: UserContextDto) {
    const gameId = await this.commandBus.execute<JoinGameCommand, string>(
      new JoinGameCommand(user.id),
    );
    return this.queryBus.execute<GetGameByIdQuery, GameViewDto>(
      new GetGameByIdQuery(gameId),
    );
  }

  @Post('pairs/my-current/answers')
  @HttpCode(HttpStatus.OK)
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

  @Get('pairs/my-current')
  @UseGuards(JwtAuthGuard)
  async showActiveGame(@ExtractUserFromRequest() user: UserContextDto) {
    return this.queryBus.execute<GetActiveGameForPlayerQuery, GameViewDto>(
      new GetActiveGameForPlayerQuery(user.id),
    );
  }

  @Get('pairs/:id')
  @UseGuards(JwtAuthGuard)
  async getGameById(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('id') gameId: string,
  ): Promise<GameViewDto> {
    return this.queryBus.execute<GetGameByIdForPlayerQuery, GameViewDto>(
      new GetGameByIdForPlayerQuery(gameId, user.id),
    );
  }

  @Get('users/my-statistic')
  @UseGuards(JwtAuthGuard)
  async getStatisticUser(@ExtractUserFromRequest() user: UserContextDto) {
    return this.commandBus.execute<
      StatisticGameCommand,
      {
        sumScore: number;
        avgScores: number;
        gamesCount: number;
        winsCount: number;
        lossesCount: number;
        drawsCount: number;
      }
    >(new StatisticGameCommand(user.id));
  }
}
