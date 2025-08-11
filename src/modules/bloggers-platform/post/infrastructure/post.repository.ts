import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import {
  LikePost,
  likePostDocument,
  likePostModelType,
} from '../../like/domain/like-post.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreatePostDto } from '../api/input-dto/post.input-dto';
import { PostDto } from '../dto/post.dto';
import { UpdatePostDto } from '../dto/create-post.dto';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(LikePost.name)
    private likePostModel: likePostModelType,

    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<PostDto | null> {
    const post = await this.dataSource.query(
      `
      SELECT * 
      FROM "Post" 
      WHERE id = $1 AND "deletedAt" IS NULL`,
      [id],
    );

    if (post.length === 0) return null;
    return post[0];
  }

  async createPost(dto: CreatePostDto, blogName: string): Promise<number> {
    const result = await this.dataSource.query(
      `
    INSERT INTO "Post" (
      title, 
      content, 
      "shortDescription",
      "blogId", 
      "blogName"
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
      [dto.title, dto.content, dto.shortDescription, dto.blogId, blogName],
    );

    return result[0].id;
  }

  async deletePost(id: number): Promise<void> {
    const deleteAr = new Date();
    await this.dataSource.query(
      `
    UPDATE "Post"
    SET "deletedAt" = $1
    WHERE "id" = $2`,
      [deleteAr, id],
    );
  }

  async updatePost(
    id: number,
    dto: UpdatePostDto,
    blogId: number,
    blogName: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE "Post"
    SET 
      "title" = $1,
      "content" = $2,
      "shortDescription" = $3,
      "blogId" = $4,
      "blogName" = $5
    WHERE "id" = $6
  `,
      [dto.title, dto.content, dto.shortDescription, blogId, blogName, id],
    );
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
