import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../domain/player.entity';
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
}
