export class CreateBlogDomainDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export class UpdateBlogDomainDto extends CreateBlogDomainDto {}
