import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../../domain/player.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { TopUserViewDto } from '../../api/view-dto/top-user.view-dto';
import { GetTopUsersQueryParams } from '../../../game/api/input-dto/get-top-user-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { Game } from '../../../game/domain/game.entity';

@Injectable()
export class PlayerQueryRepository {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async getTopUsers(
    query: GetTopUsersQueryParams,
  ): Promise<PaginatedViewDto<TopUserViewDto[]>> {
    const { pageNumber, pageSize, sort } = query;

    const qb = this.playerRepository
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .innerJoin(Game, 'g', 'g.player_1_id = p.id OR g.player_2_id = p.id')
      .select('u.id', 'userId')
      .addSelect('u.login', 'login')
      .addSelect('SUM(p.score)', 'sumScore')
      .addSelect('COUNT(g.id)', 'gamesCount')
      .addSelect(
        `SUM(CASE WHEN p.score > COALESCE(
        CASE WHEN p.id = g.player_1_id THEN (SELECT p2.score FROM player p2 WHERE p2.id = g.player_2_id)
             WHEN p.id = g.player_2_id THEN (SELECT p1.score FROM player p1 WHERE p1.id = g.player_1_id)
        END, 0) THEN 1 ELSE 0 END)`,
        'winsCount',
      )
      .addSelect(
        `SUM(CASE WHEN p.score < COALESCE(
        CASE WHEN p.id = g.player_1_id THEN (SELECT p2.score FROM player p2 WHERE p2.id = g.player_2_id)
             WHEN p.id = g.player_2_id THEN (SELECT p1.score FROM player p1 WHERE p1.id = g.player_1_id)
        END, 0) THEN 1 ELSE 0 END)`,
        'lossesCount',
      )
      .addSelect(
        `SUM(CASE WHEN p.score = COALESCE(
        CASE WHEN p.id = g.player_1_id THEN (SELECT p2.score FROM player p2 WHERE p2.id = g.player_2_id)
             WHEN p.id = g.player_2_id THEN (SELECT p1.score FROM player p1 WHERE p1.id = g.player_1_id)
        END, 0) THEN 1 ELSE 0 END)`,
        'drawsCount',
      )
      .groupBy('u.id')
      .addGroupBy('u.login');

    const fieldMap: Record<string, string> = {
      sumScore: 'SUM(p.score)',
      gamesCount: 'COUNT(g.id)',
      winsCount: '"winsCount"',
      lossesCount: '"lossesCount"',
      drawsCount: '"drawsCount"',
    };

    const sortParams: [string, 'ASC' | 'DESC'][] = [];

    (sort ?? []).forEach((s) => {
      const [field, dir] = s.trim().split(/\s+|[.]/);
      sortParams.push([
        field,
        (dir?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
      ]);
    });

    if (sortParams.length === 0) {
      sortParams.push(['sumScore', 'DESC']);
    }

    sortParams.forEach(([field, dir], idx) => {
      const column = fieldMap[field] ?? field;
      if (idx === 0) qb.orderBy(column, dir);
      else qb.addOrderBy(column, dir);
    });

    const totalCount = await qb.getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    const items = await qb
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<TopUserViewDto>();

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }
}
