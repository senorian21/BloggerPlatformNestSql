import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreatePostDto } from '../api/input-dto/post.input-dto';
import { PostDto } from '../dto/post.dto';
import { UpdatePostDto } from '../dto/create-post.dto';

@Injectable()
export class PostRepository {
  constructor(

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

    async createLikePost(
        postId: number,
        userId: number,
        likeStatusReq: string,  // 'like' | 'dislike' | 'none'
        userLogin: string,
    ): Promise<void> {
        const status = likeStatusReq.toLowerCase().trim();
        if (!['like', 'dislike', 'none'].includes(status)) {
            throw new Error(`Invalid like status: ${likeStatusReq}`);
        }

        await this.dataSource.query(
            `
                WITH
                    old AS (
                        SELECT status AS old_status
                        FROM "PostLike"
                        WHERE "postId" = $1 AND "userId" = $2
                    ),
                    upsert AS (
                INSERT INTO "PostLike" ("postId","userId",status,"addedAt")
                VALUES ($1,$2,$3,NOW())
                ON CONFLICT ("postId","userId")
                    DO UPDATE SET
                    status    = EXCLUDED.status,
                           "addedAt" = CASE
                           WHEN "PostLike".status <> EXCLUDED.status THEN NOW()
                           ELSE "PostLike"."addedAt"
                END
        RETURNING status AS new_status
      ),
      calc AS (
        SELECT old.old_status, upsert.new_status
        FROM upsert
        LEFT JOIN old ON TRUE
      ),
      del_nl AS (
        DELETE FROM "newestLikes" nl
        USING calc
        WHERE nl."postId" = $1
                AND nl.userid   = $2
                AND calc.old_status = 'like'
                AND calc.new_status <> 'like'
                RETURNING 1
                ),
                ins_nl AS (
                INSERT INTO "newestLikes" ("addedAt", userid, login, "postId")
                SELECT NOW(), $2, $4, $1
                FROM calc
                WHERE (calc.old_status IS DISTINCT FROM 'like')
                AND calc.new_status = 'like'
                RETURNING 1
                )
                UPDATE "Post" p
                SET
                    "likeCount" = GREATEST(
                            0,
                            p."likeCount" +
                            CASE
                                WHEN calc.old_status = 'like' AND calc.new_status <> 'like' THEN -1
                                WHEN calc.old_status IS DISTINCT FROM 'like' AND calc.new_status = 'like' THEN 1
                                ELSE 0
                                END
                                  ),
                    "dislikeCount" = GREATEST(
                            0,
                            p."dislikeCount" +
                            CASE
                                WHEN calc.old_status = 'dislike' AND calc.new_status <> 'dislike' THEN -1
                                WHEN calc.old_status IS DISTINCT FROM 'dislike' AND calc.new_status = 'dislike' THEN 1
                                ELSE 0
                                END
                                     )
                    FROM calc
                WHERE p.id = $1;
            `,
            [postId, userId, status, userLogin],
        );
    }
}
