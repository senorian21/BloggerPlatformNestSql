import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetTopUsersQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return String(value)
      .split(';')
      .map((v) => v.trim())
      .filter(Boolean);
  })
  @Matches(
    /^(sumScore|gamesCount|winsCount|lossesCount|drawsCount)(\.| )(asc|desc)$/i,
    {
      each: true,
      message:
        'sort must be in format "fieldName.asc|desc", allowed fields: sumScore, gamesCount, winsCount, lossesCount, drawsCount',
    },
  )
  sort?: string[];
}
