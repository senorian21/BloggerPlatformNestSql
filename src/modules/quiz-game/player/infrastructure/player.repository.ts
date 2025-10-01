import { InjectRepository } from '@nestjs/typeorm';
import { GameStatusPlayer, Player } from '../domain/player.entity';
import { EntityManager, Repository } from 'typeorm';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Game } from '../../game/domain/game.entity';

export class PlayerRepository {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async save(player: Player): Promise<void> {
    await this.playerRepository.save(player);
  }

  withManager(manager: EntityManager): PlayerRepository {
    return new PlayerRepository(manager.getRepository(Player));
  }

  async findByUserIdAndGameId(
    userId: number,
    gameId: string,
  ): Promise<Player | null> {
    return this.playerRepository
      .createQueryBuilder('player')
      .innerJoin(
        'game',
        'game',
        '(game.player_1_id = player.id OR game.player_2_id = player.id)',
      )
      .where('player.userId = :userId', { userId })
      .andWhere('game.id = :gameId', { gameId })
      .getOne();
  }

  async findByUserIdLastPlayer(userId: number): Promise<Player | null> {
    return await this.playerRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdOrFail(id: number): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id },
    });
    if (!player) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Not Found',
      });
    }
    return player;
  }

  async addBonusAndSave(player: Player): Promise<Player> {
    player.addBonus();
    return this.playerRepository.save(player);
  }

  async getUserStats(userId: number) {
    const players = await this.playerRepository.find({
      where: { userId },
    });

    if (players.length === 0) {
      return {
        sumScore: 0,
        avgScores: 0,
        gamesCount: 0,
        winsCount: 0,
        lossesCount: 0,
        drawsCount: 0,
      };
    }

    const sumScore = players.reduce((acc, p) => acc + p.score, 0);
    const gamesCount = players.length;
    const avgScores =
      gamesCount > 0 ? parseFloat((sumScore / gamesCount).toFixed(2)) : 0;

    const winsCount = players.filter(
      (p) => p.status === GameStatusPlayer.Winner,
    ).length;
    const lossesCount = players.filter(
      (p) => p.status === GameStatusPlayer.Losing,
    ).length;
    const drawsCount = players.filter(
      (p) => p.status === GameStatusPlayer.Draw,
    ).length;

    return {
      sumScore,
      avgScores,
      gamesCount,
      winsCount,
      lossesCount,
      drawsCount,
    };
  }
}
