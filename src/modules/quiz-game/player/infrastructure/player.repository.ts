import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../domain/player.entity';
import { Repository } from 'typeorm';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class PlayerRepository {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async save(player: Player): Promise<void> {
    await this.playerRepository.save(player);
  }

  async findByUserId(userId: number): Promise<Player | null> {
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
}
