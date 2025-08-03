export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
}

export class UpdatePostDto extends CreatePostDto {}
