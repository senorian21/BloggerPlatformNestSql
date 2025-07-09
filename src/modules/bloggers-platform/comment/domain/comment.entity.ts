import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-Info.schema';
import {
  CreateCommentDomainDto,
  UpdateCommentDomainDto,
} from './dto/create-comment.domain.dto';
import { likeStatus } from './dto/like-status.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

export const contentConstraints = {
  minLength: 20,
  maxLength: 300,
};

@Schema()
export class Comment {
  @Prop({ type: String, required: true })
  postId: string;
  @Prop({ type: String, required: true })
  content: string;
  @Prop({ type: CommentatorInfoSchema, required: true })
  commentatorInfo: CommentatorInfo;
  @Prop({ type: Date, required: true })
  createdAt: Date;
  @Prop({ type: Date, default: null })
  deletedAt: Date;
  @Prop({ type: Number, default: 0 })
  likeCount: number;
  @Prop({ type: Number, default: 0 })
  dislikeCount: number;

  static createComment(
    dto: CreateCommentDomainDto,
    postId: string,
    userId: string,
    userLogin: string,
  ) {
    const newComment = new this();
    newComment.postId = postId;
    newComment.content = dto.content;
    newComment.commentatorInfo = {
      userId: userId,
      userLogin: userLogin,
    };
    newComment.createdAt = new Date();
    return newComment as CommentDocument;
  }
  updateComment(dto: UpdateCommentDomainDto) {
    this.content = dto.content;
  }
  softDeletedComment() {
    this.deletedAt = new Date();
  }
  setLikeStatus(newStatus: likeStatus, previousStatus: likeStatus): void {
    if (previousStatus === likeStatus.Like) {
      this.likeCount -= 1;
    } else if (previousStatus === likeStatus.Dislike) {
      this.dislikeCount -= 1;
    }

    if (newStatus === likeStatus.Like) {
      this.likeCount += 1;
    } else if (newStatus === likeStatus.Dislike) {
      this.dislikeCount += 1;
    }
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
