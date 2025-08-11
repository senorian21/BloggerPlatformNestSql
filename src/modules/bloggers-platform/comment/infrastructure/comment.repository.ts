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
} from '../../like/domain/like=comment.entity';
import { CreateCommentDto, UpdateCommentDto } from '../dto/create-comment.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentDto } from '../dto/comment.dto';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: CommentModelType,

    @InjectModel(LikeComment.name)
    private likeCommentModel: likeCommentModelType,

    @InjectDataSource()
    private dataSource: DataSource,
  ) {}
  async save(comment: CommentDocument) {
    await comment.save();
  }

  async saveLike(like: likeCommentDocument) {
    await like.save();
  }

  async findById(id: number): Promise<CommentDto | null> {
    const result = await this.dataSource.query(
      `
      SELECT * 
      FROM "Comment"
      WHERE id = $1
      AND "deletedAt" IS NULL
    `,
      [id],
    );

    return result[0];
  }

  async findLikeByIdUser(
    userId: string,
    commentId: string | string[],
  ): Promise<likeCommentDocument | null> {
    const userLike = await this.likeCommentModel.findOne({ userId, commentId });
    return userLike;
  }

  async createNewComment(
    dto: CreateCommentDto,
    postId: number,
    userId: number,
    userLogin: string,
  ): Promise<number> {
    const result = await this.dataSource.query(
      `INSERT INTO "Comment" (content, "userId", "userLogin", "postId", "createdAt")
         VALUES ($1, $2, $3, $4, NOW())
           RETURNING id`,
      [dto.content, userId, userLogin, postId],
    );

    return result[0].id;
  }

  async softDeletedComment(id: number): Promise<void> {
    const deletedAt = new Date();
    await this.dataSource.query(
      `
      UPDATE "Comment" 
      SET "deletedAt" = $1 
      WHERE id = $2
    `,
      [deletedAt, id],
    );
  }

  async updateComment(dto: UpdateCommentDto, commentId: number): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE "Comment"
    SET content = $1
    WHERE "id" = $2
    `,
      [dto.content, commentId],
    );
  }
}
