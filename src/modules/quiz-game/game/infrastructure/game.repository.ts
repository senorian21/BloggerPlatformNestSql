import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game, GameStatus } from '../domain/game.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { Player } from '../../player/domain/player.entity';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  withManager(manager: EntityManager): GameRepository {
    return new GameRepository(manager.getRepository(Game));
  }

  async findById(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({ where: { id } });
  }

  async findPendingGame(): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { status: GameStatus.PendingSecondPlayer },
    });
  }

  async findActiveGameByPlayer(playerId: number): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: [
        {
          status: In([GameStatus.PendingSecondPlayer, GameStatus.Active]),
          player_1_id: playerId,
        },
        {
          status: In([GameStatus.PendingSecondPlayer, GameStatus.Active]),
          player_2_id: playerId,
        },
      ],
    });
  }

  async findActiveGameByUserId(userId: number): Promise<Game | null> {
    return this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player_1', 'p1')
      .leftJoinAndSelect('game.player_2', 'p2')
      .leftJoinAndSelect('game.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
      .where('(p1.userId = :userId OR p2.userId = :userId)', { userId })
      .andWhere('game.status = :status', { status: GameStatus.Active })
      .getOne();
  }

  async findGameByPlayerId(playerId: number): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: [{ player_1_id: playerId }, { player_2_id: playerId }],
      relations: [
        'gameQuestions',
        'gameQuestions.question',
        'player_1',
        'player_2',
      ],
    });
  }

  async findLastGameByPlayerIdForUser(userId: number): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: [{ player_1: { userId } }, { player_2: { userId } }],
      order: { pairCreatedDate: 'DESC' },
      relations: ['player_1', 'player_2'],
    });
  }

  async save(game: Game): Promise<void> {
    await this.gameRepository.save(game);
  }
}
