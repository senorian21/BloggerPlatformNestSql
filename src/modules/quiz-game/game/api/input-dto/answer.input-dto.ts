import { IsString } from 'class-validator';

export class answerInputDto {
  @IsString()
  answer: string;
}
