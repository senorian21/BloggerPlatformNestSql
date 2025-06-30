import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  descriptionConstraints,
  nameConstraints,
  websiteUrlConstraints,
} from '../../domain/blog.entity';
import { IsUrl } from 'class-validator';

export class UpdateBlogDto {
  @IsStringWithTrim(nameConstraints.minLength, nameConstraints.maxLength)
  name: string;
  @IsStringWithTrim(
    descriptionConstraints.minLength,
    descriptionConstraints.maxLength,
  )
  description: string;
  @IsUrl()
  @IsStringWithTrim(
    websiteUrlConstraints.minLength,
    websiteUrlConstraints.maxLength,
  )
  websiteUrl: string;
}
