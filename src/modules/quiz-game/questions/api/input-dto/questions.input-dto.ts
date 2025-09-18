import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { bodyQuestionLength } from '../../domain/question.entity';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsStringWithTrim(bodyQuestionLength.minLength, bodyQuestionLength.maxLength)
  body: string;

  @IsArray({ message: 'correctAnswers must be an array' })
  @ArrayNotEmpty({ message: 'correctAnswers cannot be empty' })
  @IsString({ each: true, message: 'Each correct answer must be a string' })
  correctAnswers: string[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}
