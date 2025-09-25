import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game, GameStatus } from '../domain/game.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async findById(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({ where: { id } });
  }

  async findPendingGame(): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { status: GameStatus.PendingSecondPlayer },
    });
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
