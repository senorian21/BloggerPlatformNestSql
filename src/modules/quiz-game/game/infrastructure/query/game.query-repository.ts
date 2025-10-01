import { Game } from '../../domain/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GameViewDto } from '../../api/view-dto/game.view-dto';
import { Injectable } from '@nestjs/common';
import { AnswerRepository } from '../../../answer/infrastructure/answer.repository';
import { GameSortBy } from '../../api/input-dto/game-sort-by';
import { GetGamesQueryParams } from '../../api/input-dto/get-game-query-params.input-dto';

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

  async getAllGames(
    userId: number,
    query: GetGamesQueryParams,
  ): Promise<{
    pagesCount: number;
    page: number;
    pageSize: number;
    totalCount: number;
    items: GameViewDto[];
  }> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;

    // отдельный запрос для подсчёта количества игр
    const totalCount = await this.gameRepository
      .createQueryBuilder('g')
      .leftJoin('g.player_1', 'p1')
      .leftJoin('g.player_2', 'p2')
      .where('p1.userId = :userId OR p2.userId = :userId', { userId })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    // основной запрос для выборки игр
    const qb = this.gameRepository
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
        'gq.id AS "gameQuestionId"', // используем id связи для порядка
      ])
      .where('u1.id = :userId OR u2.id = :userId', { userId });

    // сортировка игр
    if (sortBy === GameSortBy.Status) {
      qb.addOrderBy('g.status', sortDirection.toUpperCase() as 'ASC' | 'DESC');
      qb.addOrderBy('g.pairCreatedDate', 'DESC');
    } else {
      qb.addOrderBy(
        'g.pairCreatedDate',
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    // сортировка вопросов внутри игры по id записи в gameQuestions
    qb.addOrderBy('gq.id', 'ASC');

    const rawGames = await qb
      .skip(query.calculateSkip())
      .take(pageSize)
      .getRawMany();

    // группируем строки по id игры
    const grouped = rawGames.reduce(
      (acc, row) => {
        if (!acc[row.id]) acc[row.id] = [];
        acc[row.id].push(row);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const items: GameViewDto[] = [];

    for (const gameId of Object.keys(grouped)) {
      const rawGame = grouped[gameId];
      const firstPlayerId = rawGame[0].firstPlayerId;
      const secondPlayerId = rawGame[0].secondPlayerId;

      const firstPlayerAnswers = firstPlayerId
        ? await this.answerRepository.findByPlayerIdAsc(firstPlayerId)
        : [];
      const secondPlayerAnswers = secondPlayerId
        ? await this.answerRepository.findByPlayerIdAsc(secondPlayerId)
        : [];

      // mapToView должен маппить ответы по questionId в порядке rawGame
      items.push(
        GameViewDto.mapToView(rawGame, {
          firstPlayerAnswers,
          secondPlayerAnswers,
        }),
      );
    }

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }
}
