export class PostDto {
  id: number;
  deletedAt: Date;
  likeCount: number;
  dislikeCount: number;
  title: string;
  content: string;
  shortDescription: string;
  blogId: number;
  blogName: string;
  createdAt: Date;
}
