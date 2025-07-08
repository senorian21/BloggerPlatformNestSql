import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  shortDescriptionConstraints,
  titleConstraints,
} from '../../domain/post.entity';
import { websiteUrlConstraints } from '../../../blog/domain/blog.entity';
import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsStringWithTrim(titleConstraints.minLength, titleConstraints.maxLength)
  title: string;
  @IsStringWithTrim(
    shortDescriptionConstraints.minLength,
    shortDescriptionConstraints.maxLength,
  )
  shortDescription: string;
  @IsStringWithTrim(
    websiteUrlConstraints.minLength,
    websiteUrlConstraints.maxLength,
  )
  content: string;
  @IsString()
  @IsOptional()
  blogId: string;
}
