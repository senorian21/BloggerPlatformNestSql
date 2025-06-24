export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class UpdatePostDomainDto extends CreatePostDomainDto {}
