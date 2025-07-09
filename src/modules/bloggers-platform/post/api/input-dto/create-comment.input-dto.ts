import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { contentConstraints } from '../../../comment/domain/comment.entity';

export class CreateCommentDto {
  @IsStringWithTrim(contentConstraints.minLength, contentConstraints.maxLength)
  content: string;
}

export class UpdateCommentDto extends CreateCommentDto {}
