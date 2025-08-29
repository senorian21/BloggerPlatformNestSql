import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CreatePostDto } from '../api/input-dto/post.input-dto';
import { PostDto } from '../dto/post.dto';
import { UpdatePostDto } from '../dto/create-post.dto';
import { Post } from '../domain/post.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Post)
    private postRepository: Repository<Post>,
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

  async save(post: Post): Promise<void> {
    await this.postRepository.save(post);
  }
}
