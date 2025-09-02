import { Injectable } from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from '../dto/create-comment.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Comment } from '../domain/comment.entity';
import {CommentLike} from "../domain/commentLike.entity";

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
  ) {}

  async findById(id: number): Promise<Comment | null> {
    return await this.commentRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  async softDeletedComment(id: number): Promise<void> {
    await this.commentRepository.softDelete(id);
  }

  async createLikeComment(
      commentId: number,
      userId: number,
      likeStatusReq: string,
  ) {
    const normalizedStatus = likeStatusReq.toLowerCase(); // 'like' | 'dislike' | 'none'

    // 1. Получаем старый лайк, если он есть
    const oldLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    const oldStatus = oldLike?.status ?? null;

    // 2. Если лайка нет — создаём, иначе обновляем
    if (!oldLike) {
      const newLike = this.commentLikeRepository.create({
        commentId,
        userId,
        status: normalizedStatus,
      });
      await this.commentLikeRepository.save(newLike);
    } else {
      if (oldLike.status !== normalizedStatus) {
        oldLike.status = normalizedStatus;
        oldLike.addedAt = new Date();
        await this.commentLikeRepository.save(oldLike);
      }
    }

    // 3. Обновляем счётчики в комментарии
    const comment = await this.commentRepository.findOneBy({ id: commentId });
    if (!comment) return;

    // Логика изменения лайков
    if (oldStatus === 'like' && normalizedStatus !== 'like') {
      comment.likeCount = Math.max(0, comment.likeCount - 1);
    } else if (oldStatus !== 'like' && normalizedStatus === 'like') {
      comment.likeCount += 1;
    }

    // Логика изменения дизлайков
    if (oldStatus === 'dislike' && normalizedStatus !== 'dislike') {
      comment.dislikeCount = Math.max(0, comment.dislikeCount - 1);
    } else if (oldStatus !== 'dislike' && normalizedStatus === 'dislike') {
      comment.dislikeCount += 1;
    }

    await this.commentRepository.save(comment);
  }

  async save(comment: Comment) {
    await this.commentRepository.save(comment);
  }
}
