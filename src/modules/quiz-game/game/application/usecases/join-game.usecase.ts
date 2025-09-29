import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersExternalQueryRepository } from '../../../../user-accounts/user/infrastructure/external-query/users.external-query-repository';
import { Player } from '../../../player/domain/player.entity';
import { PlayerRepository } from '../../../player/infrastructure/player.repository';
import { Game, GameStatus } from '../../domain/game.entity';
import { GameRepository } from '../../infrastructure/game.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { QuestionRepository } from '../../../questions/infrastructure/question.repository';
import { DataSource } from 'typeorm';

export class JoinGameCommand {
  constructor(public userId: number) {}
}

@CommandHandler(JoinGameCommand)
export class JoinGameUseCase
  implements ICommandHandler<JoinGameCommand, string>
{
  constructor(
    private readonly usersExternalQueryRepository: UsersExternalQueryRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly gameRepository: GameRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute({ userId }: JoinGameCommand): Promise<string> {
    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);

    return this.dataSource.transaction(async (manager): Promise<string> => {
      const playerRepo = this.playerRepository.withManager(manager);
      const gameRepo = this.gameRepository.withManager(manager);
      const questionRepo = this.questionRepository.withManager(manager);

      const lastGame = await gameRepo.findLastGameByPlayerIdForUser(userId);
      if (lastGame) {
        if (
          lastGame.status === GameStatus.Active ||
          lastGame.status === GameStatus.PendingSecondPlayer
        ) {
          throw new DomainException({
            code: DomainExceptionCode.Forbidden,
            message:
              'The user is already involved in an active or pending game',
          });
        }
      }

      const player = Player.create(userId);
      await playerRepo.save(player);

      const pendingGame = await gameRepo.findPendingGame();

      if (pendingGame && pendingGame.player_1_id !== player.id) {
        const questions = await questionRepo.findPublishedRandom(5);
        pendingGame.connectionSecondPlayer(player.id, questions);
        await gameRepo.save(pendingGame);
        return pendingGame.id;
      }

      const newGame = Game.create(player.id);
      await gameRepo.save(newGame);
      return newGame.id;
    });
  }
}
