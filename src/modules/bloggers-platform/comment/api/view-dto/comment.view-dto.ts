import { CommentDto } from '../../dto/comment.dto';
export class CommentRawRow {
  id: string; // c.id::text
  content: string; // c.content
  createdAt: Date; // c.createdAt
  likesCount: number; // c.likeCount
  dislikesCount: number; // c.dislikeCount
  userId: string; // u.id::text
  userLogin: string; // u.login
  myStatus?: string; // подзапрос
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };

  static mapToView = (
    comment: CommentRawRow,
    myStatus: string,
  ): CommentViewDto => {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: myStatus ?? 'None',
      },
    };
  };
}
