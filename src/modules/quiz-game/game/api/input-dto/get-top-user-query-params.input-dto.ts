import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetTopUsersQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      // ["sumScore desc", "avgScores desc"]
      return value.map((v) => String(v).trim()).filter(Boolean);
    }
    return String(value)
      .split(/[;,]/) // поддержим и ; и ,
      .map((v) => v.trim())
      .filter(Boolean);
  })
  @Matches(
    /^(sumScore|gamesCount|winsCount|lossesCount|drawsCount|avgScores)(\.| )(asc|desc)$/i,
    {
      each: true,
      message:
        'sort must be in format "fieldName.asc|desc", allowed fields: sumScore, gamesCount, winsCount, lossesCount, drawsCount, avgScores',
    },
  )
  sort?: string[];
}
