import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NewestLikes, NewestLikesSchema } from './newest-likes.schema';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { likeStatus } from './dto/like-status.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

export const titleConstraints = {
  minLength: 3,
  maxLength: 30,
};

export const shortDescriptionConstraints = {
  minLength: 3,
  maxLength: 100,
};

export const contentConstraints = {
  minLength: 3,
  maxLength: 1000,
};

@Schema()
export class Post {
  @Prop({ type: String, required: true })
  title: string;
  @Prop({ type: String, required: true })
  shortDescription: string;
  @Prop({ type: String, required: true })
  content: string;
  @Prop({ type: String, required: true })
  blogId: string;
  @Prop({ type: String, required: true })
  blogName: string;
  @Prop({ type: Date, required: true })
  createdAt: Date;
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
  @Prop({ type: Number, default: 0, required: true })
  likeCount: number;
  @Prop({ type: Number, default: 0, required: true })
  dislikeCount: number;
  @Prop({ type: [NewestLikesSchema], required: false, default: [] })
  newestLikes: NewestLikes[];

  static createInstance(dto: CreatePostDomainDto, blogName: string) {
    const newPost = new this();
    newPost.title = dto.title;
    newPost.content = dto.content;
    newPost.shortDescription = dto.shortDescription;
    newPost.blogId = dto.blogId;
    newPost.blogName = blogName;
    newPost.createdAt = new Date();
    return newPost as PostDocument;
  }
  updatePost(dto: CreatePostDomainDto, blogName: string) {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    this.blogId = dto.blogId;
    this.blogName = blogName;
  }

  deletePost() {
    this.deletedAt = new Date();
  }

  public setLikeStatus(
    userId: string,
    login: string,
    newStatus: likeStatus,
    previousStatus: likeStatus,
  ): void {
    const existingLikeIndex = this.newestLikes.findIndex(
      (entry) => entry.userId === userId,
    );

    if (existingLikeIndex > -1) {
      this._removeLike(existingLikeIndex);
    }

    if (previousStatus === likeStatus.Dislike) {
      this.dislikeCount -= 1;
    }

    if (newStatus === likeStatus.Like) {
      this._addLike(userId, login);
    } else if (newStatus === likeStatus.Dislike) {
      this.dislikeCount += 1;
    }
  }

  private _addLike(userId: string, login: string): void {
    this.likeCount += 1;

    this.newestLikes.unshift({
      addedAt: new Date(),
      userId,
      login,
    });

    if (this.newestLikes.length > 3) {
      this.newestLikes.pop();
    }
  }

  private _removeLike(index: number): void {
    const removed = this.newestLikes.splice(index, 1)[0];
    if (removed) {
      this.likeCount -= 1;
    }
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
