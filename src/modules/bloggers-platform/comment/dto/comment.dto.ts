export class CommentDto {
  id: number;
  content: string;
  userId: number;
  postId: number;
  userLogin: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
  deletedAt: Date;
}
