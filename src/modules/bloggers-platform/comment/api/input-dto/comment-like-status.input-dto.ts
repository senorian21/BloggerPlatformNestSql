import { IsEnum, IsString } from 'class-validator';
import { likeStatus } from '../../../like/domain/like.entity';

export class CommentLikeStatusInputDto {
  @IsEnum(likeStatus)
  @IsString()
  likeStatus: likeStatus;
}
