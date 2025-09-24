import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/user.decorator';
import { UserContextDto } from '../../../user-accounts/auth/dto/user-context.dto';
import {CommandBus, QueryBus} from "@nestjs/cqrs";
import {JoinGameCommand} from "../application/usecases/join-game.usecase";
import {GetGameByIdQuery} from "../application/queries/get-game-by-id";
import {GameViewDto} from "./view-dto/game.view-dto";
import {AnswerCommand} from "../application/usecases/answer.usecase";
import {answerInputDto} from "./input-dto/answer.input-dto";

@Controller('pair-game-quiz/pairs')
export class pairGameQuizController {
  constructor(
      private readonly commandBus: CommandBus,
      private readonly queryBus: QueryBus,
  ) {}


  @Post('connection')
  @UseGuards(JwtAuthGuard)
  async connectUser(@ExtractUserFromRequest() user: UserContextDto) {
    const gameId = await this.commandBus.execute<JoinGameCommand, string>(new JoinGameCommand(user.id))
    return this.queryBus.execute<GetGameByIdQuery, GameViewDto>( new GetGameByIdQuery(gameId))
  }

  @Post('my-current/answers')
  @UseGuards(JwtAuthGuard)
  async answer(
      @ExtractUserFromRequest() user: UserContextDto,
      @Body()dto: answerInputDto) {
      await this.commandBus.execute<AnswerCommand, void>(new AnswerCommand(user.id, dto.answer))
  }
}
