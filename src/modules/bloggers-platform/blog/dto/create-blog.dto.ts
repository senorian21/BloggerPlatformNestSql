import { IsString } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  name: string;
  @IsString()
  description: string;
  @IsString()
  websiteUrl: string;
}

export class UpdateBlogDto extends CreateBlogDto {}
