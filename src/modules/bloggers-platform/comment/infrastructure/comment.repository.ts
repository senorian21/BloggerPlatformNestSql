import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import {
  LikeComment,
  likeCommentDocument,
  likeCommentModelType,
} from '../../like/domain/like.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: CommentModelType,
    @InjectModel(LikeComment.name)
    private likeCommentModel: likeCommentModelType,
  ) {}
  async save(comment: CommentDocument) {
    await comment.save();
  }

  async saveLike(like: likeCommentDocument) {
    await like.save();
  }

  async findById(id: string): Promise<CommentDocument | null> {
    const comment = await this.commentModel.findById(id);
    if (!comment || comment.deletedAt !== null) {
      return null;
    }
    return comment;
  }

  async findLikeByIdUser(
    userId: string,
    commentId: string | string[],
  ): Promise<likeCommentDocument | null> {
    const userLike = await this.likeCommentModel.findOne({ userId, commentId });
    return userLike;
  }
}
