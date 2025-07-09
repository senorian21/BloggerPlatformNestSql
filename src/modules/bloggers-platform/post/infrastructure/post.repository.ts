import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import {
  LikePost,
  likePostDocument,
  likePostModelType,
} from '../../like/domain/like-post.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    @InjectModel(LikePost.name)
    private likePostModel: likePostModelType,
  ) {}
  async save(post: PostDocument) {
    await post.save();
  }

  async findById(id: string): Promise<PostDocument | null> {
    const post = await this.PostModel.findById(id);
    if (!post || post.deletedAt !== null) {
      return null;
    }
    return post;
  }

  async findLikeByIdUser(
    userId: string,
    postId: string,
  ): Promise<likePostDocument | null> {
    return this.likePostModel.findOne({ userId, postId });
  }

  async saveLike(like: likePostDocument) {
    await like.save();
  }
}
