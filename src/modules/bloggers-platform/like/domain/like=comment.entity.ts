import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export enum likeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Schema()
export class LikeComment {
  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date;
  @Prop({
    type: String,
    enum: Object.values(likeStatus),
    default: likeStatus.None,
  })
  status: likeStatus;
  @Prop({
    type: String,
    required: true,
  })
  userId: string;
  @Prop({
    type: String,
    required: true,
  })
  commentId: string;

  static createLikeComment(
    commentId: string,
    userId: string,
    likeStatusReq: likeStatus,
  ) {
    const like = new this();
    like.commentId = commentId;
    like.userId = userId;
    like.status = likeStatusReq;
    like.createdAt = new Date();
    return like as likeCommentDocument;
  }
  updateLikeComment(likeStatusReq: likeStatus) {
    this.status = likeStatusReq;
  }
}

export const likeCommentShema = SchemaFactory.createForClass(LikeComment);

likeCommentShema.loadClass(LikeComment);

export type likeCommentDocument = HydratedDocument<LikeComment>;

export type likeCommentModelType = Model<likeCommentDocument> &
  typeof LikeComment;
