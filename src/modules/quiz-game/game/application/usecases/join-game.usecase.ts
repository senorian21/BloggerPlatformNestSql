import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import { Player } from '../../../player/domain/player.entity';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';
import { Game, GameStatus } from '../../domain/game.entity';
import { GameRepository } from '../../infrastructure/game.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { QuestionRepository } from '../../../questions/infrastructure/question.repository';

export class JoinGameCommand {
  constructor(public userId: number) {}
}

@CommandHandler(JoinGameCommand)
export class JoinGameUseCase
  implements ICommandHandler<JoinGameCommand, string>
{
  constructor(
    private usersExternalQueryRepository: UsersExternalQueryRepository,
    private playerRepository: PlayerRepository,
    private gameRepository: GameRepository,
    private questionRepository: QuestionRepository,
  ) {}

  async execute({ userId }: JoinGameCommand): Promise<string> {
    // Проверяем, что пользователь существует
    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);

    // Проверяем последнюю игру пользователя
    const lastGame =
      await this.gameRepository.findLastGameByPlayerIdForUser(userId);

    if (lastGame) {
      if (
        lastGame.status === GameStatus.Active ||
        lastGame.status === GameStatus.PendingSecondPlayer
      ) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'The user is already involved in an active or pending game',
        });
      }
      // если Finished → продолжаем, создадим нового игрока
    }

    // Создаём нового игрока для каждой новой игры
    const player = Player.create(userId);
    await this.playerRepository.save(player);

    // Ищем чужую pending‑игру
    const pendingGame = await this.gameRepository.findPendingGame();

    if (pendingGame && pendingGame.player_1_id !== player.id) {
      const questions = await this.questionRepository.findPublishedRandom(5);
      pendingGame.connectionSecondPlayer(player.id, questions);
      await this.gameRepository.save(pendingGame);
      return pendingGame.id;
    }

    // Создаём новую игру
    const newGame = Game.create(player.id);
    await this.gameRepository.save(newGame);
    return newGame.id;
  }
}
