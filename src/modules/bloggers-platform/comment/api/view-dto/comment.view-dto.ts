import { CommentDocument } from '../../domain/comment.entity';

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
    comment: CommentDocument,
    myStatus: string,
  ): CommentViewDto => {
    const dto = new CommentViewDto();
    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    };
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likeCount,
      dislikesCount: comment.dislikeCount,
      myStatus: myStatus,
    };
    return dto;
  };
}
