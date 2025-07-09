import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { likeStatus } from './like=comment.entity';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class LikePost {
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
  postId: string;

  static createLikePost(
    postId: string,
    userId: string,
    likeStatusReq: likeStatus,
  ): likePostDocument {
    const like = new this();
    like.userId = userId;
    like.postId = postId;
    like.createdAt = new Date();
    like.status = likeStatusReq;
    return like as likePostDocument;
  }
  updateLikePost(likeStatusReq: likeStatus) {
    this.status = likeStatusReq;
  }
}

export const likePostShema = SchemaFactory.createForClass(LikePost);

likePostShema.loadClass(LikePost);

export type likePostDocument = HydratedDocument<LikePost>;

export type likePostModelType = Model<likePostDocument> & typeof LikePost;
