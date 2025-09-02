import { Injectable } from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from '../dto/create-comment.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Comment } from '../domain/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
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

    await this.dataSource.query(
      `
                WITH
                    old AS (
                        SELECT status AS old_status
                        FROM "CommentLike"
                        WHERE "commentId" = $1
                          AND "userId"    = $2
                    ),
                    ins AS (
                INSERT INTO "CommentLike" ("commentId", "userId", status, "addedAt")
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT ("commentId", "userId")
                    DO UPDATE SET
                    status    = EXCLUDED.status,
                           "addedAt" = CASE
                           WHEN "CommentLike".status <> EXCLUDED.status THEN NOW()
                           ELSE "CommentLike"."addedAt"
                END
        RETURNING status AS new_status
      ),
      calc AS (
        SELECT
          old.old_status,
          ins.new_status
        FROM ins
        LEFT JOIN old ON TRUE
      )
                UPDATE "Comment" c
                SET
                    "likesCount" = GREATEST(
                            0,
                            c."likesCount" +
                            CASE
                                WHEN calc.old_status = 'like'
                                    AND calc.new_status <> 'like' THEN -1
                                WHEN calc.old_status IS DISTINCT FROM 'like'
                                AND calc.new_status = 'like' THEN 1
                                ELSE 0
                                END
                                   ),
                    "dislikesCount" = GREATEST(
                            0,
                            c."dislikesCount" +
                            CASE
                                WHEN calc.old_status = 'dislike'
                                    AND calc.new_status <> 'dislike' THEN -1
                                WHEN calc.old_status IS DISTINCT FROM 'dislike'
                                AND calc.new_status = 'dislike' THEN 1
                                ELSE 0
                                END
                                      )
                    FROM calc
                WHERE c.id = $1;
            `,
      [commentId, userId, normalizedStatus],
    );
  }

  async save(comment: Comment) {
    await this.commentRepository.save(comment);
  }
}
