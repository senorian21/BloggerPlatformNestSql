import { Game } from '../../domain/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GameViewDto } from '../../api/view-dto/game.view-dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
  ) {}

  async getGameViewByIdOrNotFoundFail(id: string): Promise<GameViewDto> {
    const rawGame = await this.gameRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.player_1', 'p1')
      .leftJoinAndSelect('g.player_2', 'p2')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p2.user', 'u2')
      .leftJoinAndSelect('p1.answers', 'a1')
      .leftJoinAndSelect('p2.answers', 'a2')
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
      .select([
        'g.id AS id',
        'g.status AS status',
        'g.pairCreatedDate AS "pairCreatedDate"',
        'g.startGameDate AS "startGameDate"',
        'g.finishGameDate AS "finishGameDate"',

        'p1.id AS "firstPlayerId"',
        'u1.login AS "firstPlayerLogin"',
        'p2.id AS "secondPlayerId"',
        'u2.login AS "secondPlayerLogin"',

        'gq.questionId AS "firstPlayerAnswer_questionId"',
        'a1.answerStatus AS "firstPlayerAnswer_answerStatus"',
        'a1.body AS "firstPlayerAnswer_body"',
        'a1.addedAt AS "firstPlayerAnswer_addedAt"',

        'gq.questionId AS "secondPlayerAnswer_questionId"',
        'a2.answerStatus AS "secondPlayerAnswer_answerStatus"',
        'a2.body AS "secondPlayerAnswer_body"',
        'a2.addedAt AS "secondPlayerAnswer_addedAt"',

        'q.id AS "questionId"',
        'q.body AS "questionBody"',
      ])
      .where('g.id = :id', { id })
      .getRawMany();

    if (!rawGame.length) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Game not found.',
      });
    }

    return GameViewDto.mapToView(rawGame);
  }
}
