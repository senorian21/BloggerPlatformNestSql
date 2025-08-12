import {CommentDto} from "../../dto/comment.dto";


export class CommentViewDto {
  id: number;
  content: string;
  commentatorInfo: {
    userId: number;
    userLogin: string;
  };
  createdAt: Date;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };

  static mapToView = (
    comment: CommentDto,
    myStatus: string,
  ): CommentViewDto => {
    const dto = new CommentViewDto();
    dto.id = comment.id;
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.userId,
      userLogin: comment.userLogin,
    };
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
      myStatus: myStatus,
    };
    return dto;
  };
}
