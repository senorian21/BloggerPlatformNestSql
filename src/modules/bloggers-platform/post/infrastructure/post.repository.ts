import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CreatePostDto } from '../api/input-dto/post.input-dto';
import { PostDto } from '../dto/post.dto';
import { UpdatePostDto } from '../dto/create-post.dto';
import { Post } from '../domain/post.entity';
import { PostLike } from '../domain/postLike.entity';
import { NewestLikes } from '../domain/newestLikes.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,

    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,

    @InjectRepository(NewestLikes)
    private newestLikesRepository: Repository<NewestLikes>,
  ) {}

  async findById(id: number): Promise<Post | null> {
    const post = await this.postRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return post;
  }

  async softDeletePost(id: number): Promise<void> {
    await this.postRepository.softDelete(id);
    this.postRepository.softDelete(id);
  }

  async createLikePost(
    postId: number,
    userId: number,
    likeStatusReq: string, // 'like' | 'dislike' | 'none'
    userLogin: string,
  ): Promise<void> {
    const status = likeStatusReq.toLowerCase().trim();
    if (!['like', 'dislike', 'none'].includes(status)) {
      throw new Error(`Invalid like status: ${likeStatusReq}`);
    }

    // 1. Получаем старый лайк, если он есть
    const oldLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });
    const oldStatus = oldLike?.status ?? null;

    // 2. Upsert в postLike
    if (!oldLike) {
      const newLike = this.postLikeRepository.create({
        postId,
        userId,
        status,
        addedAt: new Date(),
      });
      await this.postLikeRepository.save(newLike);
    } else {
      if (oldLike.status !== status) {
        oldLike.status = status;
        oldLike.addedAt = new Date();
        await this.postLikeRepository.save(oldLike);
      }
    }

    // 3. Обновляем newestLikes
    if (oldStatus === 'like' && status !== 'like') {
      await this.newestLikesRepository.delete({ postId, userId });
    }
    if (oldStatus !== 'like' && status === 'like') {
      const nl = this.newestLikesRepository.create({
        postId,
        userId,
        login: userLogin,
        addedAt: new Date(),
      });
      await this.newestLikesRepository.save(nl);
    }

    // 4. Обновляем счётчики в post
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) return;

    // Лайки
    if (oldStatus === 'like' && status !== 'like') {
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else if (oldStatus !== 'like' && status === 'like') {
      post.likeCount += 1;
    }

    // Дизлайки
    if (oldStatus === 'dislike' && status !== 'dislike') {
      post.dislikeCount = Math.max(0, post.dislikeCount - 1);
    } else if (oldStatus !== 'dislike' && status === 'dislike') {
      post.dislikeCount += 1;
    }

    await this.postRepository.save(post);
  }

  async save(post: Post): Promise<void> {
    await this.postRepository.save(post);
  }
}
