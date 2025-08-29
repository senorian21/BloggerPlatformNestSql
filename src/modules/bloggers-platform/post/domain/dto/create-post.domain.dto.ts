export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: number;
}

export class UpdatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
}
