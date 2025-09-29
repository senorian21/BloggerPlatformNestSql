import { Game } from '../../domain/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GameViewDto } from '../../api/view-dto/game.view-dto';
import { Injectable } from '@nestjs/common';
import { AnswerRepository } from '../../../answer/infrastructure/answer.repository';

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,

    private answerRepository: AnswerRepository,
  ) {}

  async getGameViewByIdOrNotFoundFail(id: string): Promise<GameViewDto> {
    const rawGame = await this.gameRepository
      .createQueryBuilder('g')
      .leftJoin('g.player_1', 'p1')
      .leftJoin('g.player_2', 'p2')
      .leftJoin('p1.user', 'u1')
      .leftJoin('p2.user', 'u2')
      .leftJoin('g.gameQuestions', 'gq')
      .leftJoin('gq.question', 'q')
      .select([
        'g.id AS id',
        'g.status AS status',
        'g.pairCreatedDate AS "pairCreatedDate"',
        'g.startGameDate AS "startGameDate"',
        'g.finishGameDate AS "finishGameDate"',

        'p1.id AS "firstPlayerId"',
        'p1.score AS "firstPlayerScore"',
        'u1.id AS "firstPlayerUserId"',
        'u1.login AS "firstPlayerLogin"',

        'p2.id AS "secondPlayerId"',
        'p2.score AS "secondPlayerScore"',
        'u2.id AS "secondPlayerUserId"',
        'u2.login AS "secondPlayerLogin"',

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

    const firstPlayerId = rawGame[0].firstPlayerId;
    const secondPlayerId = rawGame[0].secondPlayerId;

    const firstPlayerAnswers = firstPlayerId
      ? await this.answerRepository.findByPlayerId(firstPlayerId)
      : [];
    const secondPlayerAnswers = secondPlayerId
      ? await this.answerRepository.findByPlayerId(secondPlayerId)
      : [];

    return GameViewDto.mapToView(rawGame, {
      firstPlayerAnswers,
      secondPlayerAnswers,
    });
  }
}
