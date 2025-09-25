import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../domain/player.entity';
import { Repository } from 'typeorm';

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
}
