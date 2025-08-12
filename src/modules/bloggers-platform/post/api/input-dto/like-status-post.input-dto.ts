import { IsEnum, IsString } from 'class-validator';
import { likeStatus } from '../../../like/domain/like-comment.entity';

export class LikeStatusInputDto {
  @IsString()
  @IsEnum(likeStatus)
  likeStatus: likeStatus;
}

export class LikeStatusUpdateInputDto extends LikeStatusInputDto {}
